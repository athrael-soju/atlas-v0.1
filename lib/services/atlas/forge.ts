import {
  AtlasFile,
  FileActionResponse,
  ForgeParams,
  Purpose,
} from '@/lib/types';
import { handleFileDeletion, handleFileUpload } from '../storage/handler';
import { embedDocument } from '../embedding/openai';
import { upsertDocument } from '../indexing/pinecone';
import { parse } from '../parsing/handler';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { db } from '../db/mongodb';
import { deleteFromVectorDb } from '@/lib/services/atlas/archivist';

const fsProvider = process.env.FILESYSTEM_PROVIDER ?? 'local';

export async function processDocument(
  file: File,
  userEmail: string,
  forgeParams: ForgeParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  const totalStartTime = performance.now();
  const dbInstance = await db();
  let atlasFile: AtlasFile;
  try {
    // Upload File
    const uploadResponse: FileActionResponse = await measurePerformance(
      () => handleFileUpload(file, userEmail, fsProvider),
      `Uploading to Scribe: '${file.name}'`,
      sendUpdate
    );
    atlasFile = uploadResponse.file;

    // Parse File
    const parseResponse = await measurePerformance(
      () =>
        parse(
          forgeParams.provider,
          forgeParams.minChunkSize,
          forgeParams.maxChunkSize,
          forgeParams.overlap,
          atlasFile
        ),
      `Parsing: '${file.name}'`,
      sendUpdate
    );

    // Embed Document
    const embedResponse = await measurePerformance(
      () => embedDocument(atlasFile, parseResponse, userEmail),
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

    // Update DB
    await measurePerformance(
      () => dbInstance.insertArchive(userEmail, Purpose.Scribe, atlasFile),
      `Updating DB: '${file.name}'`,
      sendUpdate
    );

    // Clean Up
    await measurePerformance(
      () => handleFileDeletion(atlasFile, userEmail),
      `Cleaning up: '${file.name}'`,
      sendUpdate
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    sendUpdate('error', `Error processing '${file.name}': ${error.message}`);

    // Rollback changes
    await deleteFromVectorDb(atlasFile!, userEmail);
    await dbInstance.purgeArchive(userEmail, Purpose.Scribe, atlasFile!.id);
    await handleFileDeletion(atlasFile!, userEmail);

    return { success: false, fileName: file.name, error: error.message };
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}
