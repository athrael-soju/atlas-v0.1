import { NextRequest, NextResponse } from 'next/server';
import { summon, reform, consult, dismiss } from '@/lib/utils/analysis/sage';
import { SageAction, SageParams } from '@/lib/types';

export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  try {
    controller.enqueue(JSON.stringify({ type, message }));
  } catch (error) {
    console.error('Failed to send update:', error);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const action = data.get('action') as SageAction;
    const sageParams = JSON.parse(
      data.get('sageParams') as string
    ) as SageParams;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        try {
          let response;
          switch (action) {
            case 'summon':
              response = await summon(sageParams, send);
              sendUpdate('notification', controller, JSON.stringify(response));
              break;
            case 'reform':
              response = await reform(sageParams, send);
              sendUpdate('notification', controller, JSON.stringify(response));
              break;
            case 'consult':
              response = await consult(sageParams, send);
              break;
            case 'dismiss':
              response = await dismiss(sageParams, send);
              sendUpdate('notification', controller, JSON.stringify(response));
              break;
            default:
              sendUpdate('notification', controller, 'Invalid Action');
          }
        } catch (error: any) {
          console.error('Error:', error);
          sendUpdate('notification', controller, error.message);
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
    console.error('Failed to process request:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
