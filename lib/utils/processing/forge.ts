import { FileEntry, ForgeParams } from '@/lib/types';
import { handleFileDeletion, handleFileUpload } from '../storage/handler';
import { embedDocument } from '../embedding/openai';
import { upsertDocument } from '../indexing/pinecone';
import { parse } from '../parsing/handler';
import { measurePerformance } from '@/lib/utils/metrics';

const fsProvider = process.env.FILESYSTEM_PROVIDER ?? 'local';

export async function processDocument(
  file: File,
  userEmail: string,
  forgeParams: ForgeParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  const totalStartTime = performance.now();

  try {
    // Upload File
    const uploadResponse = await measurePerformance(
      () => handleFileUpload(file, userEmail, fsProvider),
      `Uploading: '${file.name}'`,
      sendUpdate
    );

    // Parse File
    const parseResponse = await measurePerformance(
      () =>
        parse(
          forgeParams.provider,
          forgeParams.minChunkSize,
          forgeParams.maxChunkSize,
          forgeParams.overlap,
          uploadResponse.file as FileEntry
        ),
      `Parsing: '${file.name}'`,
      sendUpdate
    );

    // Embed Document
    const embedResponse = await measurePerformance(
      () => embedDocument(parseResponse, userEmail),
      `Embedding: '${file.name}'`,
      sendUpdate
    );

    // Upsert Document
    await measurePerformance(
      () =>
        upsertDocument(
          embedResponse.embeddings,
          userEmail,
          forgeParams.chunkBatch
        ),
      `Upserting: '${file.name}'`,
      sendUpdate
    );

    // Clean Up
    await measurePerformance(
      () => handleFileDeletion(uploadResponse.file as FileEntry, userEmail),
      `Cleaning up: '${file.name}'`,
      sendUpdate
    );

    const totalEndTime = performance.now();
    sendUpdate(
      'notification',
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    const totalEndTime = performance.now();
    sendUpdate('error', `Error processing '${file.name}': ${error.message}`);
    sendUpdate(
      'error',
      `Total process for '${file.name}' completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return { success: false, fileName: file.name, error: error.message };
  }
}
