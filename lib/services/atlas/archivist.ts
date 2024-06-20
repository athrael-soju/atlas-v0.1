import {
  ArchivistOnboardingParams,
  ArchivistParams,
  AtlasFile,
  Purpose,
} from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { FileDeleted } from 'openai/resources/files';
import { getIndex } from '@/lib/client/pinecone';
import { Index } from '@pinecone-database/pinecone';
import { updateSage, deleteFromOpenAi } from '@/lib/services/processing/openai';

export async function retrieveArchives(
  userEmail: string,
  archivistParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { purpose } = archivistParams;
    const dbInstance = await db();

    const userFiles = await measurePerformance(
      () => dbInstance.retrieveArchives(userEmail, purpose),
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
export async function onboardUser(
  userEmail: string,
  onboardingParams: ArchivistOnboardingParams,
  sendUpdate: (type: string, message: string) => void
) {
  const totalStartTime = performance.now();
  const { userName, description, selectedAssistant } = onboardingParams;
  try {
    if (!userName || !description || !selectedAssistant) {
      throw new Error(
        'User name, description and selected assistant are required'
      );
    }
    const dbInstance = await db();

    const onboardingUpdated = await measurePerformance(
      () =>
        dbInstance.updateUser(userEmail as string, {
          preferences: {
            name: userName,
            description: description,
            selectedAssistant: selectedAssistant,
          },
        }),
      'Updating user onboarding in DB',
      sendUpdate
    );

    if (!onboardingUpdated) {
      throw new Error('DB update unsuccessful');
    }
  } catch (error: any) {
    sendUpdate('error', `Onboarding user failed: ${error.message}`);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function purgeArchive(
  userEmail: string,
  archivistParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { fileId, purpose } = archivistParams;

    if (!fileId) {
      throw new Error('File ID is required');
    }

    const dbInstance = await db();

    const file = await measurePerformance(
      () => dbInstance.retrieveArchive(userEmail, purpose, fileId),
      'Retrieving archive from DB',
      sendUpdate
    );

    if (!file) {
      throw new Error('File not found');
    }

    const deletionResult = await measurePerformance(
      () => dbInstance.purgeArchive(userEmail, purpose, file.id as string),
      'Purging archive from DB',
      sendUpdate
    );

    if (deletionResult.modifiedCount !== 1) {
      throw new Error('DB deletion unsuccessful');
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

export async function deleteFromVectorDb(
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
        `Purge archive in Vector DB failed: ${error.message} for document ${file.id}`
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
      `Failed to list document chunks: ${error.message} for document ${file.id}`
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
