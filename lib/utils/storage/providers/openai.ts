import { openai } from '@/lib/client/openai';

interface FileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

// TODO: Add a store to keep track of uploaded files, based on userEmail
export async function uploadDocumentToOpenAi(
  file: File,
  userEmail: string
): Promise<FileUploadResponse> {
  try {
    const response = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });

    return response;
  } catch (error: any) {
    throw new Error('Failed to upload document to OpenAI', error.message);
  }
}
