import { NextRequest, NextResponse } from 'next/server';
import { summon, reform, consult, dismiss } from '@/lib/utils/analysis/sage';
import { SageAction, SageParams } from '@/lib/types';
import { AssistantStream } from 'openai/lib/AssistantStream';

// Define runtime for the handler
export const runtime = 'nodejs';

// Helper function to send updates
function sendUpdate(
  type: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(JSON.stringify({ type, message }));
}

async function readStreamContent(
  stream: ReadableStream,
  controller: ReadableStreamDefaultController
): Promise<void> {
  AssistantStream.fromReadableStream(stream)
    .on('textCreated', (text) => {
      sendUpdate('assistant', controller, '');
    })
    .on('textDelta', (textDelta, snapshot) => {
      sendUpdate('assistant', controller, textDelta.value ?? '');
    })
    .on('toolCallCreated', (toolCall) => {
      sendUpdate('code', controller, toolCall.type);
    })
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === 'code_interpreter') {
        if (toolCallDelta.code_interpreter?.input) {
          sendUpdate('code', controller, toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter?.outputs) {
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === 'logs') {
              console.log(`\nlog: ${output.logs}\n`);
            }
          });
        }
      }
    })
    .on('imageFileDone', (image) => {
      const imageUrl = `\n![${image.file_id}](/api/files/${image.file_id})\n`;
      sendUpdate('image', controller, imageUrl);
    })
    .on('event', (event) => {
      if (event.event === 'thread.run.requires_action') {
        sendUpdate('event', controller, 'Requires action');
        console.log('Requires action:', event.data);
      }
      if (event.event === 'thread.run.completed') {
        sendUpdate('event', controller, event.data.status);
        console.log('Event:', event.data.status);
      }
    })
    .on('end', () => {
      controller.close();
    });
}

// Main POST handler for Sage API
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
        const send = (type: string, message: string) =>
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
              const responseStream = await consult(sageParams, send);
              if (responseStream) {
                await readStreamContent(responseStream, controller);
              }
              break;
            case 'dismiss':
              await dismiss(sageParams, send);
              break;
            default:
              controller.enqueue('data: Invalid action\n\n');
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
