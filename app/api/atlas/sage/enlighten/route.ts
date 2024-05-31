import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'perf_hooks';
import fs from 'fs';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI();

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(`data: ${message}\n\n`);
}

async function storeFile(
  file: File,
  sendUpdate: (message: string) => void
): Promise<{
  success: boolean;
  fileName: string;
  response: any;
}> {
  try {
    let startTime, endTime;
    startTime = performance.now();
    sendUpdate(`Uploading: '${file.name}'`);

    if (file.type.includes('text')) {
      const response = await openai.files.create({
        file: fs.createReadStream(file.name),
        purpose: 'assistants',
      });

      endTime = performance.now();
      sendUpdate(
        `Uploaded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
      );

      return { success: true, fileName: file.name, response: response };
    } else {
      sendUpdate(`Unsupported file type: ${file.type}`);
      return {
        success: false,
        fileName: file.name,
        response: 'Unsupported file type',
      };
    }
  } catch (error: any) {
    sendUpdate(`Error processing ${file.name}: ${error.message}`);
    return {
      success: false,
      fileName: file.name,
      response: error.message,
    };
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const files = data.getAll('files') as File[];
    const userEmail = data.get('userEmail') as string;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    } else if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) => sendUpdate(controller, message);

        const results = await Promise.all(
          files.map((file) => {
            return storeFile(file, send);
          })
        );

        const success = results.filter((result) => result.success).length;
        const failed = results.filter((result) => !result.success).length;

        send(`Success: ${success}. Failed: ${failed}`);
        controller.close();
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
