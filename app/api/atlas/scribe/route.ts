import { NextRequest, NextResponse } from 'next/server';
import { ConsultationParams, Purpose, ScribeParams } from '@/lib/types';
import { consult, retrieveContext } from '@/lib/services/atlas/assistants';
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

async function handleConsultation(
  userEmail: string,
  message: string,
  send: (type: string, message: string) => void
) {
  const retrieveResponse = await retrieveContext(userEmail, message, send);
  const consultationParams: ConsultationParams = {
    message: message,
    context: retrieveResponse.context,
  };
  await consult(userEmail, Purpose.Scribe, consultationParams, send);
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  const data = await req.formData();
  const userEmail = data.get('userEmail') as string;
  const message = data.get('message') as string;

  if (!userEmail || !message) {
    throw new Error('User email and message are required');
  }

  await handleConsultation(userEmail, message, send);
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
