import { NextRequest, NextResponse } from 'next/server';
import { consult } from '@/lib/services/atlas/sage';
import { Purpose, SageParams } from '@/lib/types';

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
    const userEmail = data.get('userEmail') as string;
    const purpose = data.get('purpose') as Purpose;
    const sageParams = JSON.parse(
      data.get('sageParams') as string
    ) as SageParams;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        try {
          await consult(userEmail, purpose, sageParams, send);
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
