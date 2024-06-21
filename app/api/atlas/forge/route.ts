import { NextRequest, NextResponse } from 'next/server';
import { ForgeParams } from '@/lib/types';
import { processDocument } from '@/lib/services/atlas/forge';
import { processDocumentViaOpenAi } from '@/lib/services/processing/openai';
import { getTotalTime } from '@/lib/utils/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  const data = JSON.stringify({ type, message });
  controller.enqueue(`data: ${data}\n\n`);
}

async function handleFileProcessing(
  file: File,
  userEmail: string,
  forgeParams: ForgeParams,
  send: (type: string, message: string) => void
) {
  if (file.type === 'application/pdf') {
    return processDocument(file, userEmail, forgeParams, send);
  } else if (file.type === 'text/csv') {
    return processDocumentViaOpenAi(file, userEmail, send);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  let success = 0,
    failed = 0;

  const data = await req.formData();
  const files = data.getAll('files') as File[];
  const userEmail = data.get('userEmail') as string;

  if (!userEmail || !files) {
    throw new Error('User email and files are required');
  }

  const forgeParams = JSON.parse(
    data.get('forgeParams') as string
  ) as ForgeParams;

  if (!files.length) {
    throw new Error('No files uploaded');
  }

  const results = await Promise.allSettled(
    files.map((file) =>
      handleFileProcessing(file, userEmail, forgeParams, send)
        .then(() => ({ success: true }))
        .catch((error) => {
          failed++;
          return {
            success: false,
            error: error.message,
            fileName: file.name,
          };
        })
    )
  );

  success = results.filter((result) => result.status === 'fulfilled').length;
  failed = results.filter((result) => result.status === 'rejected').length;

  send('final-notification', `Success: ${success}. Failed: ${failed}`);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const stream = new ReadableStream({
      start(controller) {
        const totalStartTime = performance.now();
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        processRequest(req, send)
          .catch((error) => {
            sendUpdate('error', controller, error.message);
          })
          .finally(() => {
            const totalEndTime = performance.now();
            getTotalTime(totalStartTime, totalEndTime, send);
            controller.close();
          });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
