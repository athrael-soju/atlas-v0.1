import { NextRequest, NextResponse } from 'next/server';
import { ConsultationParams, Purpose, ScribeParams } from '@/lib/types';
import { consult, retrieveContext } from '@/lib/services/atlas/assistants';
import { getTotalTime } from '@/lib/utils/metrics';

export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  const data = JSON.stringify({ type, message });
  controller.enqueue(`data: ${data}\n\n`);
}

async function handleConsultation(
  userEmail: string,
  scribeParams: ScribeParams,
  send: (type: string, message: string) => void
) {
  const retrieveResponse = await retrieveContext(userEmail, scribeParams, send);
  const consultationParams: ConsultationParams = {
    message: scribeParams.message,
    context: retrieveResponse.context,
  };
  const response = await consult(
    userEmail,
    Purpose.Scribe,
    consultationParams,
    send
  );
  send('final-notification', JSON.stringify(response.content));
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  const data = await req.formData();
  const userEmail = data.get('userEmail') as string;
  const scribeParams = JSON.parse(
    data.get('scribeParams') as string
  ) as ScribeParams;

  if (!userEmail || !scribeParams.message) {
    throw new Error('User email and message are required');
  }

  await handleConsultation(userEmail, scribeParams, send);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const stream = new ReadableStream({
      start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        const totalStartTime = performance.now();
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
