import { openai } from '@/lib/client/openai';

export async function uploadDocumentToOpenAi(file: File, userId: string) {
  // TODO: Add a store to keep track of uploaded files, based on userId
  const response = await openai.files.create({
    file: file,
    purpose: 'assistants',
  });

  return response;
}
