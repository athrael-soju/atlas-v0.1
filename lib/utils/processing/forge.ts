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
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  const totalStartTime = performance.now();

  const fsProvider = process.env.FILESYSTEM_PROVIDER ?? 'local';

  try {
    let startTime, endTime;
    startTime = performance.now();
    sendUpdate('notification', `Uploading: '${file.name}'`);
    const uploadResponse: FileActionResponse = await handleFileUpload(
      file,
      userEmail,
      fsProvider
    );
    endTime = performance.now();
    sendUpdate(
      'notification',
      `Uploaded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification', `Parsing: '${file.name}'`);
    const parseResponse = await parse(
      forgeParams.provider,
      forgeParams.minChunkSize,
      forgeParams.maxChunkSize,
      forgeParams.overlap,
      uploadResponse.file as FileEntry
    );

    endTime = performance.now();
    sendUpdate(
      'notification',
      `Parsed '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification', `Embedding: '${file.name}'`);
    const embedResponse: EmbeddingResponse = await embedDocument(
      parseResponse,
      userEmail
    );
    endTime = performance.now();
    sendUpdate(
      'notification',
      `Embedded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification', `Upserting: '${file.name}'`);
    await upsertDocument(
      embedResponse.embeddings,
      userEmail,
      forgeParams.chunkBatch
    );
    endTime = performance.now();
    sendUpdate(
      'notification',
      `Upserted '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification', `Cleaning up: '${file.name}'`);
    await handleFileDeletion(uploadResponse.file as FileEntry, userEmail);
    endTime = performance.now();
    sendUpdate(
      'notification',
      `Cleaned up '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    const totalEndTime = performance.now();
    sendUpdate(
      'notification',
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    const totalEndTime = performance.now();
    sendUpdate(
      'notification',
      `Error processing ${file.name}: ${error.message}`
    );
    sendUpdate(
      'notification',
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return {
      success: false,
      fileName: file.name,
      error: error.message,
    };
  }
}
