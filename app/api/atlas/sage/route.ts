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
  controller.enqueue(`${type}: ${message}\n\n`);
}

async function readStreamContent(
  type: string,
  stream: ReadableStream,
  controller: ReadableStreamDefaultController
): Promise<void> {
  AssistantStream.fromReadableStream(stream)
    .on('textCreated', (text) => {
      sendUpdate(type, controller, '\nassistant > ');
      console.log('\nassistant > ', text.value ?? '');
    })
    .on('textDelta', (textDelta, snapshot) => {
      sendUpdate(type, controller, textDelta.value ?? '');
      console.log(textDelta.value ?? '');
    })
    .on('toolCallCreated', (toolCall) => {
      sendUpdate(type, controller, `\nassistant > ${toolCall.type}\n\n`);
      console.log(`\nassistant > ${toolCall.type}\n\n`);
    })
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === 'code_interpreter') {
        if (toolCallDelta.code_interpreter?.input) {
          sendUpdate(type, controller, toolCallDelta.code_interpreter.input);
          console.log(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter?.outputs) {
          sendUpdate(type, controller, '\noutput >\n');
          console.log('\noutput >\n');
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === 'logs') {
              console.log(`\n${output.logs}\n`);
            }
          });
        }
      }
    })
    .on('end', () => {
      sendUpdate('notification', controller, 'Sage consulted successfully');
      controller.close();
    });
}
// Simplified version of the function
// async function readStreamContent(
//   stream: ReadableStream,
//   controller: ReadableStreamDefaultController
// ): Promise<void> {
//   const reader = stream.getReader();
//   const decoder = new TextDecoder();
//   let done = false;
//   while (!done) {
//     const { value, done: readerDone } = await reader.read();
//     done = readerDone;
//     if (value) {
//       const text = decoder.decode(value, { stream: true });
//       sendUpdate(controller, text);
//     }
//   }
//   controller.close();
// }

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

    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) =>
          sendUpdate('notification', controller, message);
        let responseStream: ReadableStream | null = null;

        try {
          switch (action) {
            case 'summon':
              responseStream = await summon(sageParams, send);
              break;
            case 'reform':
              responseStream = await reform(sageParams, send);
              break;
            case 'consult':
              responseStream = await consult(sageParams, send);
              break;
            case 'dismiss':
              responseStream = await dismiss(sageParams, send);
              break;
            default:
              controller.enqueue(`data: Invalid action\n\n`);
              break;
          }

          if (responseStream) {
            await readStreamContent('sage_data', responseStream, controller);
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
