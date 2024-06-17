import { NextRequest, NextResponse } from 'next/server';
import { summon, dismiss } from '@/lib/services/atlas/custodian';
import { CustodianAction, CustodianParams } from '@/lib/types';

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
    const action = data.get('action') as CustodianAction;
    const userEmail = data.get('userEmail') as string;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    const custodianParams = JSON.parse(
      data.get('custodianParams') as string
    ) as CustodianParams;

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
          switch (action) {
            case 'summon':
              await summon(userEmail, custodianParams, send);
              break;
            case 'dismiss':
              await dismiss(userEmail, send);
              break;
            default:
              sendUpdate('notification', controller, 'Invalid Action');
          }
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
