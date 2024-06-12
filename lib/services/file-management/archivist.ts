import { ArchivistParams, AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { openai } from '@/lib/client/openai';
import { FileDeleted } from 'openai/resources/files';
import { getIndex } from '@/lib/client/pinecone';

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
      () => dbInstance.getUserFiles(userEmail),
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

    const purpose = file.purpose;
    if (purpose === Purpose.Sage) {
      const fileDeleted = await measurePerformance(
        () => deleteFromOpenAi(file.id as string),
        'Purging archives from OpenAi',
        sendUpdate
      );
      return fileDeleted as FileDeleted;
    } else if (purpose === Purpose.Scribe) {
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

async function deleteFromOpenAi(fileId: string): Promise<unknown> {
  try {
    const result = await openai.files.del(fileId);
    return result;
  } catch (error: any) {
    throw new Error(`Failed to delete file from OpenAI: ${error.message}`);
  }
}

async function deleteFromVectorDb(
  file: AtlasFile,
  userEmail: string
): Promise<unknown> {
  try {
    const index = await getIndex();
    const results = await index.namespace(userEmail).listPaginated({
      prefix: `${file.name}#${file.id}`,
    });

    const vectorIds = results.vectors?.map((vector) => vector.id);

    if (!vectorIds) {
      throw new Error('No vectors found to delete');
    }

    const result = await index.namespace(userEmail).deleteMany(vectorIds);
    return result;
  } catch (error: any) {
    throw new Error(`Failed to delete vectors from VectorDB: ${error.message}`);
  }
}
