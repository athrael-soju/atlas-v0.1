import { OpenAiFileUploadResponse } from '@/lib/types';
import { handleFileDeletion, handleFileUpload } from '../storage/handler';

export async function processDocumentViaOpenAi(
  file: File,
  userEmail: string,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; fileName: string; error?: string }> {
  try {
    let startTime, endTime;
    startTime = performance.now();
    sendUpdate('notification', `Uploading: '${file.name}'`);
    const fsProvider = 'openai';
    await handleFileUpload(file, userEmail, fsProvider);
    endTime = performance.now();
    sendUpdate(
      'notification',
      `Uploaded '${file.name}' in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    return { success: true, fileName: file.name };
  } catch (error: any) {
    sendUpdate(
      'notification',
      `Error processing ${file.name}: ${error.message}`
    );
    return {
      success: false,
      fileName: file.name,
      error: error.message,
    };
  }
}
