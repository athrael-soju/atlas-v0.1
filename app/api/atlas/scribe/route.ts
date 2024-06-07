import { NextRequest, NextResponse } from 'next/server';
import { ArchiveParams } from '@/lib/types';
import { retrieveContext } from '@/lib/utils/retrieval/scribe';

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
    const content = data.get('content') as string;
    const archiveParams = JSON.parse(
      data.get('archiveParams') as string
    ) as ArchiveParams;

    if (!archiveParams.userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content in user message' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);

        try {
          const response = await retrieveContext(content, archiveParams, send);
          sendUpdate(
            'final-notification',
            controller,
            JSON.stringify(response.content)
          );
        } catch (error: any) {
          sendUpdate('error', controller, `Error: ${error.message}`);
        } finally {
          controller.close();
        }
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
