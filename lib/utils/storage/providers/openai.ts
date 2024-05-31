import fs from 'fs';
import { OpenAI } from 'openai';

const openai = new OpenAI();

export async function uploadDocumentToOpenAi(file: File, userId: string) {
  // TODO: Add a store to keep track of uploaded files, based on userId
  const response = await openai.files.create({
    file: file,
    purpose: 'assistants',
  });

  return response;
}
