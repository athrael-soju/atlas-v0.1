import { NextRequest, NextResponse } from 'next/server';

import { ForgeParams } from '@/lib/types';
import { processDocument } from '@/lib/utils/processing/rag-processor';
import { processDocumentViaOpenAi } from '@/lib/utils/processing/openai';
export const runtime = 'nodejs';

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(`data: ${message}\n\n`);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const files = data.getAll('files') as File[];
    const userEmail = data.get('userEmail') as string;
    const forgeParams = JSON.parse(
      data.get('forgeParams') as string
    ) as ForgeParams;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) => sendUpdate(controller, message);

        const results = await Promise.all(
          files.map((file) => {
            if (file.type === 'application/pdf') {
              return processDocument(file, userEmail, forgeParams, send);
            } else if (file.type.includes('text')) {
              return processDocumentViaOpenAi(file, userEmail, send);
            } else {
              sendUpdate(controller, `Unsupported file type: ${file.type}`);
              return Promise.resolve({
                success: false,
                fileName: file.name,
                error: `Unsupported file type: ${file.type}`,
              });
            }
          })
        );

        const success = results.filter((result) => result.success).length;
        const failed = results.filter((result) => !result.success).length;

        send(`Success: ${success}. Failed: ${failed}`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
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
