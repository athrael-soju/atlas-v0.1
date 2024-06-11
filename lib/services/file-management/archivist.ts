import { ArchivistParams, AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { openai } from '@/lib/client/openai';
import { FileDeleted } from 'openai/resources/files';

export async function recoverArchives(
  sageParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail } = sageParams;

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
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function purgeArchive(
  sageParams: ArchivistParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail, fileIds } = sageParams;

    if (!userEmail || fileIds?.length !== 1) {
      throw new Error('User email and a single file ID are required');
    }

    const dbInstance = await db();

    const file = await measurePerformance(
      () => dbInstance.getUserFile(userEmail, fileIds[0]),
      'Retrieving archive from DB',
      sendUpdate
    );

    const purpose = file?.purpose;
    const deletionResult = await measurePerformance(
      () => dbInstance.deleteFile(userEmail, file?.id as string),
      'Purging archive from DB',
      sendUpdate
    );

    if (deletionResult.modifiedCount !== 1) {
      throw new Error('Failed to delete file from DB');
    }

    if (purpose === Purpose.Sage) {
      const fileDeleted = await measurePerformance(
        () => deleteFromOpenAi(file?.id as string),
        'Purging sage from OpenAi',
        sendUpdate
      );
      return fileDeleted as FileDeleted;
    } else if (purpose === Purpose.Scribe) {
      await measurePerformance(
        () => deleteFromVectorDb(file?.id as string),
        'Purging thread from OpenAi',
        sendUpdate
      );
    }
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}
async function deleteFromOpenAi(fileId: string): Promise<unknown> {
  const result = await openai.files.del(fileId);
  return result;
}

async function deleteFromVectorDb(fileId: string): Promise<unknown> {
  return 'Bingo Boingo';
}
