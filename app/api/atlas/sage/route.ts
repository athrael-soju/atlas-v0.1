import { NextRequest, NextResponse } from 'next/server';
import { summon, reform, dismiss } from '@/lib/utils/analysis/sage';
import { SageAction } from '@/lib/types';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { action, ...rest } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (message: string) => {
          controller.enqueue(`data: ${message}\n\n`);
        };

        try {
          let response;
          switch (action as SageAction) {
            case 'summon':
              response = await summon(rest, sendUpdate);
              controller.enqueue(`data: Sage summoned successfully\n\n`);
              controller.enqueue(`data: ${JSON.stringify(response)}\n\n`);
              break;
            case 'reform':
              response = await reform(rest, sendUpdate);
              controller.enqueue(`data: Sage reformed successfully\n\n`);
              controller.enqueue(`data: ${JSON.stringify(response)}\n\n`);
              break;
            case 'dismiss':
              response = await dismiss(rest, sendUpdate);
              controller.enqueue(`data: Sage dismissed successfully\n\n`);
              controller.enqueue(`data: ${JSON.stringify(response)}\n\n`);
              break;
            default:
              controller.enqueue(`data: Invalid action\n\n`);
              break;
          }
          controller.close();
        } catch (error: any) {
          controller.enqueue(`data: Error: ${error.message}\n\n`);
          controller.error(error);
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
