import { ArchivistParams, AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { FileDeleted } from 'openai/resources/files';
import { getIndex } from '@/lib/client/pinecone';
import { Index } from '@pinecone-database/pinecone';
import { updateSage, deleteFromOpenAi } from '@/lib/services/processing/openai';

export async function recoverArchives(
  archivistParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail } = archivistParams;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    const dbInstance = await db();

    const userFiles = await measurePerformance(
      () => dbInstance.getAllUserFiles(userEmail),
      'Checking for archives',
      sendUpdate
    );
    return userFiles;
  } catch (error: any) {
    sendUpdate('error', `Recover archives failed: ${error.message}`);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function purgeArchive(
  archivistParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail, fileId } = archivistParams;

    if (!userEmail || !fileId) {
      throw new Error('User email and a single file ID are required');
    }

    const dbInstance = await db();

    const file = await measurePerformance(
      () => dbInstance.getUserFile(userEmail, fileId),
      'Retrieving archive from DB',
      sendUpdate
    );

    if (!file) {
      throw new Error('File not found');
    }

    const deletionResult = await measurePerformance(
      () => dbInstance.deleteFile(userEmail, file.id as string),
      'Purging archive from DB',
      sendUpdate
    );

    if (deletionResult.modifiedCount !== 1) {
      throw new Error('Failed to delete file from DB');
    }

    if (file.purpose === Purpose.Sage) {
      const openAiFileDeleted = await measurePerformance(
        () => deleteFromOpenAi(file.id as string),
        'Purging Sage archives from OpenAI',
        sendUpdate
      );

      await measurePerformance(
        () => updateSage(dbInstance, userEmail),
        'Updating Sage in OpenAI',
        sendUpdate
      );

      return openAiFileDeleted as FileDeleted;
    } else if (file.purpose === Purpose.Scribe) {
      const fileDeleted = await measurePerformance(
        () => deleteFromVectorDb(file, userEmail),
        'Purging archives from VectorDb',
        sendUpdate
      );
      return fileDeleted;
    }
  } catch (error: any) {
    sendUpdate('error', `Purge archive failed: ${error.message}`);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

async function deleteFromVectorDb(
  file: AtlasFile,
  userEmail: string
): Promise<unknown> {
  const pageSize = 100;
  let paginationToken: string | undefined;
  let deleteCount = 0;

  const index = await getIndex();
  const namespace = index.namespace(userEmail);

  do {
    try {
      const result = await listArchiveChunks(
        file,
        namespace,
        pageSize,
        paginationToken
      );

      if (result.chunks.length === 0) {
        break;
      }

      const chunkIds = result.chunks.map((chunk) => chunk.id);

      await PurgeArchiveChunks(chunkIds, namespace);
      deleteCount += chunkIds.length;

      paginationToken = result.paginationToken;
    } catch (error: any) {
      throw new Error(
        `Failed to purge archives from VectorDb: ${error.message}`
      );
    }
  } while (paginationToken !== undefined);

  return deleteCount;
}

async function listArchiveChunks(
  file: AtlasFile,
  namespace: Index,
  limit: number,
  paginationToken?: string
): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
  try {
    const listResult = await namespace.listPaginated({
      prefix: `${file.name}#${file.id}`,
      limit: limit,
      paginationToken: paginationToken,
    });

    const chunks =
      listResult.vectors?.map((vector) => ({ id: vector.id || '' })) || [];
    return { chunks, paginationToken: listResult.pagination?.next };
  } catch (error: any) {
    throw new Error(
      `Failed to list archive chunks for document ${file.id}: ${error.message}`
    );
  }
}

async function PurgeArchiveChunks(chunkIds: string[], namespace: Index) {
  try {
    const deletionResult = await namespace.deleteMany(chunkIds);
    return deletionResult;
  } catch (error: any) {
    throw new Error(`Failed to delete document chunks: ${error.message}`);
  }
}
