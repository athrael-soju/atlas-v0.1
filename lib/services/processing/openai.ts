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
  const user = await dbInstance.getUser(userEmail);

  const sageId = user.assistants.sage.assistantId;
  const sageFiles = user.assistants.sage.files.map(
    (file: AtlasFile) => file.id
  );

  if (!sageId || !sageFiles) {
    throw new Error('Sage ID and files are required');
  }
  const updatedSage = await openai.beta.assistants.update(sageId, {
    tool_resources: {
      code_interpreter: {
        file_ids: sageFiles,
      },
    },
  });

  if (!updatedSage) {
    throw new Error('Failed to update Sage in OpenAI');
  }

  return sageFiles;
};
