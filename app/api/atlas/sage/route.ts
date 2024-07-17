import { NextRequest, NextResponse } from 'next/server';
import { consult } from '@/lib/services/atlas/assistants';
import { ConsultationParams, Purpose, SageParams } from '@/lib/types';
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
  sageParams: SageParams,
  send: (type: string, message: string) => void
) {
  const consultationParams: ConsultationParams = sageParams;
  await consult(
    userEmail,
    Purpose.Sage,
    consultationParams,
    send
  );
  send('final-notification', 'Consultation completed');
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  const data = await req.formData();
  const userEmail = data.get('userEmail') as string;
  const sageParams = JSON.parse(data.get('sageParams') as string) as SageParams;

  if (!userEmail) {
    throw new Error('User email is required');
  }

  await handleConsultation(userEmail, sageParams, send);
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
