import { handleFileUpload } from '../storage/handler';
import { measurePerformance } from '../../utils/metrics';
import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose } from '@/lib/types';

const fsProvider = 'openai';

export const processDocumentViaOpenAi = async (
  file: File,
  userEmail: string,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> => {
  try {
    await measurePerformance(
      () => handleFileUpload(file, userEmail, fsProvider),
      `Uploading to Sage: '${file.name}'`,
      sendUpdate
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    sendUpdate('error', error.message);
    return {
      success: false,
      fileName: file.name,
      error: error.message,
    };
  }
};

export const deleteFromOpenAi = async (fileId: string): Promise<unknown> => {
  const result = await openai.files.del(fileId);

  if (!result) {
    throw new Error('Failed to purge Sage archive from OpenAI');
  }

  return result;
};

export const updateSage = async (dbInstance: any, userEmail: string) => {
  const sageIdList = (
    await dbInstance.getUserFilesByPurpose(userEmail, Purpose.Sage)
  ).map((file: AtlasFile) => file.id);

  if (!sageIdList) {
    throw new Error('Failed to retrieve Sage list from database');
  }

  const sageId = (await dbInstance.getSageId(userEmail)) as string;

  if (!sageId) {
    throw new Error('Failed to get Sage ID from database');
  }

  const updatedSage = await openai.beta.assistants.update(sageId, {
    tool_resources: {
      code_interpreter: {
        file_ids: sageIdList,
      },
    },
  });

  if (!updatedSage) {
    throw new Error('Failed to update Sage in OpenAI');
  }

  return sageIdList;
};
