import { NextRequest, NextResponse } from 'next/server';
import { getTranscript, getSynthesis } from '@/lib/services/atlas/herald';
import { HeraldParams, AiResponseParams, VoiceParams } from '@/lib/types';
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
  action: string,
  heraldParams: HeraldParams,
  send: (type: string, message: string) => void
) {
  switch (action) {
    case 'transcribe':
      await getTranscript(heraldParams as VoiceParams, send);
      break;
    case 'synthesize':
      await getSynthesis(heraldParams as AiResponseParams, send);
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
  const action = data.get('action') as string;

  let heraldParams = {
    message: data.get('file') || data.get('message'),
  } as HeraldParams;

  if (!action) {
    throw new Error('Action is required');
  }

  await handleAction(action, heraldParams, send);
  send('final-notification', `process: ${action} completed`);
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
