import {
  EmbeddingResponse,
  FileActionResponse,
  FileEntry,
  ForgeParams,
} from '@/lib/types';
import { handleFileDeletion, handleFileUpload } from '../storage/handler';
import { embedDocument } from '../embedding/openai';
import { upsertDocument } from '../indexing/pinecone';
import { parse } from '../parsing/handler';

export async function processDocument(
  file: File,
  userEmail: string,
  forgeParams: ForgeParams,
  sendUpdate: (message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  const totalStartTime = performance.now();

  const fsProvider = process.env.FILESYSTEM_PROVIDER ?? 'local';

  try {
    let startTime, endTime;
    startTime = performance.now();
    sendUpdate(`Uploading: '${file.name}'`);
    const uploadResponse: FileActionResponse = await handleFileUpload(
      file,
      userEmail,
      fsProvider
    );
    endTime = performance.now();
    sendUpdate(
      `Uploaded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Parsing: '${file.name}'`);
    const parseResponse = await parse(
      forgeParams.provider,
      forgeParams.minChunkSize,
      forgeParams.maxChunkSize,
      forgeParams.overlap,
      uploadResponse.file as FileEntry
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
    await upsertDocument(
      embedResponse.embeddings,
      userEmail,
      forgeParams.chunkBatch
    );
    endTime = performance.now();
    sendUpdate(
      `Upserted '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate(`Cleaning up: '${file.name}'`);
    await handleFileDeletion(uploadResponse.file as FileEntry, userEmail);
    endTime = performance.now();
    sendUpdate(
      `Cleaned up '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    const totalEndTime = performance.now();
    sendUpdate(
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    const totalEndTime = performance.now();
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
