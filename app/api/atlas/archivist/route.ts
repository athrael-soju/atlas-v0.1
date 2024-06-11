import { NextRequest, NextResponse } from 'next/server';
import {} from '@/lib/services/file-management/archivist';
import { ArchivistParams } from '@/lib/types';
import {
  recoverArchives,
  purgeArchive,
} from '@/lib/services/file-management/archivist';
export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(JSON.stringify({ type, message }));
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const action = data.get('action') as string;
    const archivistParams = JSON.parse(
      data.get('archivistParams') as string
    ) as ArchivistParams;

    const userEmail = archivistParams.userEmail;

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
        try {
          switch (action) {
            case 'retrieve-file-list':
              response = await recoverArchives(archivistParams, send);
              break;
            case 'purge':
              response = await purgeArchive(archivistParams, send);
              break;
            default:
              sendUpdate('notification', controller, 'Invalid Action');
          }
        } catch (error: any) {
          sendUpdate('error', controller, error.message);
        } finally {
          sendUpdate('final-notification', controller, response);
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
