import { NextRequest, NextResponse } from 'next/server';
import { summon, dismiss } from '@/lib/services/atlas/custodian';
import { CustodianAction, CustodianParams } from '@/lib/types';
import { getTotalTime } from '@/lib/utils/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  const data = JSON.stringify({ type, message });
  controller.enqueue(`data: ${data}\n\n`);
}

async function handleAction(
  action: CustodianAction,
  userEmail: string,
  custodianParams: CustodianParams,
  send: (type: string, message: string) => void
) {
  switch (action) {
    case 'summon':
      await summon(userEmail, custodianParams, send);
      break;
    case 'dismiss':
      await dismiss(userEmail, send);
      break;
    default:
      throw new Error('Invalid Action');
  }
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  const data = await req.formData();
  const action = data.get('action') as CustodianAction;
  const userEmail = data.get('userEmail') as string;

  if (!userEmail) {
    throw new Error('User email is required');
  }

  if (!action) {
    throw new Error('Action is required');
  }

  const custodianParams = JSON.parse(
    data.get('custodianParams') as string
  ) as CustodianParams;

  const response = await handleAction(action, userEmail, custodianParams, send);
  send('final-notification', `action: ${action} completed. ${response}`);
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
