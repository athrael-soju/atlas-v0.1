import { openai } from '@/lib/client/openai';

export async function uploadDocumentToOpenAi(file: File, userEmail: string) {
  // TODO: Add a store to keep track of uploaded files, based on userEmail
  const response = await openai.files.create({
    file: file,
    purpose: 'assistants',
  });

  return response;
}
