import { handleFileDeletion, handleFileUpload } from '../storage/handler';
import { measurePerformance } from '../metrics';

const fsProvider = 'openai';

export async function processDocumentViaOpenAi(
  file: File,
  userEmail: string,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  try {
    // Upload File
    await measurePerformance(
      () => handleFileUpload(file, userEmail, fsProvider),
      `Uploading: '${file.name}'`,
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
}
