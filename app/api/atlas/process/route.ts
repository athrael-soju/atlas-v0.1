import { NextRequest } from 'next/server';
import {
  handleFileUpload,
  handleFileDeletion,
} from '@/lib/utils/storage/handler';
import { parseDocument } from '@/lib/utils/parsing/unstructured';
import { embedDocument } from '@/lib/utils/embedding/openai';
import { upsertDocument } from '@/lib/utils/indexing/pinecone';
import { EmbeddingResponse, FileActionResponse } from '@/lib/types';

export const runtime = 'nodejs';

async function processFile(
  file: File,
  userEmail: string,
  parsingStrategy: string,
  sendUpdate: (message: string) => void
) {
  try {
    sendUpdate(`Uploading: '${file.name}'`);
    const uploadResponse: FileActionResponse = await handleFileUpload(
      file,
      userEmail
    );

    sendUpdate(`Parsing: '${file.name}'`);
    const parseResponse = await parseDocument(
      uploadResponse.file,
      parsingStrategy
    );

    sendUpdate(`Embedding: '${file.name}'`);
    const embedResponse: EmbeddingResponse = await embedDocument(
      parseResponse,
      userEmail
    );

    sendUpdate(`Upserting: '${file.name}'`);
    await upsertDocument(embedResponse.embeddings, userEmail, 150);

    sendUpdate(`Cleaning up: '${file.name}'`);
    await handleFileDeletion(uploadResponse.file, userEmail);

    return { success: true, fileName: file.name };
  } catch (error: any) {
    sendUpdate(`Error processing ${file.name}: ${error.message}`);
    return {
      success: false,
      fileName: file.name,
      error: error.message,
    };
  }
}

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
) {
  controller.enqueue(`data: ${message}\n\n`);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const files = data.getAll('files') as File[];
    const userEmail = data.get('userEmail') as string;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User email is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!files.length) {
      return new Response(JSON.stringify({ error: 'No files uploaded' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const parsingStrategy = process.env
      .NEXT_PUBLIC_UNSTRUCTURED_PARSING_STRATEGY as string;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) => sendUpdate(controller, message);

        const results = await Promise.all(
          files.map((file) =>
            processFile(file, userEmail, parsingStrategy, send)
          )
        );

        const success = results.filter((result) => result.success);
        const failed = results.filter((result) => !result.success);

        // send(
        //   `Processing complete: ${success.map((result) => result.fileName)}. Failed: ${failed
        //     .map((result) => `${result.fileName}: ${result.error}`)
        //     .join(', ')}`
        // );
        send(`Success: ${success.length}. Failed: ${failed.length}`);
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
    return new Response(
      JSON.stringify({ error: `Failed to process request: ${error.message}` }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
