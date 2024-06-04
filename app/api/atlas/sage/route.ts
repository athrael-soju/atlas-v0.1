import { NextRequest, NextResponse } from 'next/server';
import { summon, reform, consult, dismiss } from '@/lib/utils/analysis/sage';
import { SageAction, SageParams } from '@/lib/types';
import { AssistantStream } from 'openai/lib/AssistantStream';

export const runtime = 'nodejs';

function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  //console.log(`${type}: ${message}`);
  controller.enqueue(`${type}: ${message}\n\n`);
}

async function readStreamContent(
  type: string,
  stream: ReadableStream,
  controller: ReadableStreamDefaultController
): Promise<void> {
  AssistantStream.fromReadableStream(stream)
    .on('textCreated', (text) => {})
    .on('textDelta', (textDelta, snapshot) => {
      sendUpdate(type, controller, snapshot.value);
    })
    .on('toolCallCreated', (toolCall) => {})
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
      if (snapshot.type === 'code_interpreter') {
        if (snapshot.code_interpreter?.input) {
          sendUpdate(type, controller, snapshot.code_interpreter.input);
        }
        if (snapshot.code_interpreter?.outputs) {
          snapshot.code_interpreter.outputs.forEach((output) => {
            if (output.type === 'logs') {
              console.log(`\nlog: ${output.logs}\n`);
            }
          });
        }
      }
    })
    .on('end', () => {
      //sendUpdate('notification', controller, 'Sage consulted successfully.');
      controller.close();
    });
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const action = data.get('action') as SageAction;
    const sageParams = JSON.parse(
      data.get('sageParams') as string
    ) as SageParams;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    let responseStream;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) =>
          sendUpdate('notification', controller, message);
        try {
          switch (action) {
            case 'summon':
              await summon(sageParams, send);
              break;
            case 'reform':
              await reform(sageParams, send);
              break;
            case 'consult':
              responseStream = await consult(sageParams, send);
              if (responseStream) {
                await readStreamContent(
                  'sage_data',
                  responseStream,
                  controller
                );
              }
              break;
            case 'dismiss':
              await dismiss(sageParams, send);
              break;
            default:
              controller.enqueue(`data: Invalid action\n\n`);
              break;
          }
        } catch (error) {
          console.error('Error in action execution:', error);
          controller.enqueue(`data: Error occurred: ${error}\n\n`);
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
    console.error('Failed to process request:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
