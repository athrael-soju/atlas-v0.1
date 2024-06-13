import { NextRequest, NextResponse } from 'next/server';
import { ScribeParams } from '@/lib/types';
import { retrieveContext } from '@/lib/services/retrieval/scribe';

export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  const data = JSON.stringify({ type, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const content = data.get('content') as string;
    const scribeParams = JSON.parse(
      data.get('scribeParams') as string
    ) as ScribeParams;

    if (!scribeParams.userEmail || !content) {
      return NextResponse.json(
        { error: 'User email and content are required' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        try {
          const response = await retrieveContext(content, scribeParams, send);
          sendUpdate(
            'final-notification',
            controller,
            JSON.stringify(response.content)
          );
        } catch (error: any) {
          sendUpdate('error', controller, error.message);
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
