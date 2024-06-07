import { NextRequest, NextResponse } from 'next/server';

import { ForgeParams } from '@/lib/types';
import { processDocument } from '@/lib/utils/processing/forge';
import { processDocumentViaOpenAi } from '@/lib/utils/processing/openai';
export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(JSON.stringify({ type, message }));
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
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        const results = await Promise.all(
          files.map((file) => {
            if (file.type === 'application/pdf') {
              return processDocument(file, userEmail, forgeParams, send);
            } else if (file.type.includes('text')) {
              return processDocumentViaOpenAi(file, userEmail, send);
            } else {
              sendUpdate(
                'notification',
                controller,
                `Unsupported file type: ${file.type}`
              );
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

        send('notification', `Success: ${success}. Failed: ${failed}`);
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
