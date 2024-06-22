import { NextRequest, NextResponse } from 'next/server';
import {
  retrieveArchives,
  purgeArchive,
  onboardUser,
} from '@/lib/services/atlas/archivist';
import { ArchivistOnboardingParams, ArchivistParams } from '@/lib/types';
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
  userEmail: string,
  archivistParams: ArchivistParams | ArchivistOnboardingParams,
  send: (type: string, message: string) => void
) {
  switch (action) {
    case 'retrieve-archives':
      return await retrieveArchives(
        userEmail,
        archivistParams as ArchivistParams,
        send
      );
    case 'purge-archive':
      return await purgeArchive(
        userEmail,
        archivistParams as ArchivistParams,
        send
      );
    case 'onboard-user':
      return await onboardUser(
        userEmail,
        archivistParams as ArchivistOnboardingParams,
        send
      );
    default:
      throw new Error('Invalid Action');
  }
}

async function processRequest(
  req: NextRequest,
  send: (type: string, message: string) => void
) {
  const data = await req.formData();
  const userEmail = data.get('userEmail') as string;
  const action = data.get('action') as string;
  const archivistParams = JSON.parse(data.get('archivistParams') as string) as
    | ArchivistParams
    | ArchivistOnboardingParams;

  if (!userEmail || !action) {
    throw new Error('User email and action are required');
  }

  const response = await handleAction(action, userEmail, archivistParams, send);
  send('final-notification', response);
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
