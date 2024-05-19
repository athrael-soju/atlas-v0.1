import { NextRequest, NextResponse } from 'next/server';
import {
  handleFileUpload,
  handleFileDeletion,
} from '@/lib/utils/storage/handler';
import { parse } from '@/lib/utils/parsing/handler';
import { embedDocument } from '@/lib/utils/embedding/openai';
import { upsertDocument } from '@/lib/utils/indexing/pinecone';
import { EmbeddingResponse, FileActionResponse } from '@/lib/types';
import { performance } from 'perf_hooks';

export const runtime = 'nodejs';

const provider = process.env.PARSING_PROVIDER || 'unstructured.io';
const maxChunkSize = parseInt(process.env.MAX_CHUNK_SIZE as string) || 1024;
const minChunkSize = parseInt(process.env.MIN_CHUNK_SIZE as string) || 256;
const overlap = parseInt(process.env.OVERLAP as string) || 128;
const chunkBatch = parseInt(process.env.CHUNK_BATCH as string) || 150;

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(`data: ${message}\n\n`);
}

async function processFile(
  file: File,
  userEmail: string,
  parsingStrategy: string,
  sendUpdate: (message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  const totalStartTime = performance.now(); // Start timing the total process
  try {
    let startTime, endTime;

    startTime = performance.now();
    sendUpdate(`Uploading: '${file.name}'`);
    const uploadResponse: FileActionResponse = await handleFileUpload(
      file,
      userEmail
    );
    endTime = performance.now();
    sendUpdate(
      `Uploaded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Parsing: '${file.name}'`);
    const parseResponse = await parse(
      provider,
      minChunkSize,
      maxChunkSize,
      overlap,
      uploadResponse.file,
      parsingStrategy
    );
    endTime = performance.now();
    sendUpdate(
      `Parsed '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Embedding: '${file.name}'`);
    const embedResponse: EmbeddingResponse = await embedDocument(
      parseResponse,
      userEmail
    );
    endTime = performance.now();
    sendUpdate(
      `Embedded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Upserting: '${file.name}'`);
    await upsertDocument(embedResponse.embeddings, userEmail, chunkBatch);
    endTime = performance.now();
    sendUpdate(
      `Upserted '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Cleaning up: '${file.name}'`);
    await handleFileDeletion(uploadResponse.file, userEmail);
    endTime = performance.now();
    sendUpdate(
      `Cleaned up '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    const totalEndTime = performance.now(); // End timing the total process
    sendUpdate(
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    const totalEndTime = performance.now(); // End timing even if there is an error
    sendUpdate(`Error processing ${file.name}: ${error.message}`);
    sendUpdate(
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return {
      success: false,
      fileName: file.name,
      error: error.message,
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
    }

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
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
