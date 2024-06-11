import { ArchivistParams } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';

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

    // TODO: Purge archive from either openAI or Vector DB

    await measurePerformance(
      () => dbInstance.deleteFile(userEmail, fileIds[0]),
      'Purging archives from DB',
      sendUpdate
    );
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}
