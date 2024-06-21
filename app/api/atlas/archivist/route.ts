import { NextRequest, NextResponse } from 'next/server';
import {} from '@/lib/services/atlas/archivist';
import { ArchivistOnboardingParams, ArchivistParams } from '@/lib/types';
import {
  retrieveArchives,
  purgeArchive,
  onboardUser,
} from '@/lib/services/atlas/archivist';
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

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const userEmail = data.get('userEmail') as string;
    const action = data.get('action') as string;
    const archivistParams = JSON.parse(
      data.get('archivistParams') as string
    ) as ArchivistParams | ArchivistOnboardingParams;

    if (!userEmail || !action) {
      return NextResponse.json(
        { error: 'User email and action are required' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
        let response;
        const totalStartTime = performance.now();
        try {
          switch (action) {
            case 'retrieve-archives':
              response = await retrieveArchives(
                userEmail,
                archivistParams as ArchivistParams,
                send
              );
              break;
            case 'purge-archive':
              response = await purgeArchive(
                userEmail,
                archivistParams as ArchivistParams,
                send
              );
              break;
            case 'onboard-user':
              response = await onboardUser(
                userEmail,
                archivistParams as ArchivistOnboardingParams,
                send
              );
              break;
            default:
              sendUpdate('notification', controller, 'Invalid Action');
          }
          sendUpdate('final-notification', controller, response);
        } catch (error: any) {
          sendUpdate('error', controller, error.message);
        } finally {
          const totalEndTime = performance.now();
          getTotalTime(totalStartTime, totalEndTime, send);
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
