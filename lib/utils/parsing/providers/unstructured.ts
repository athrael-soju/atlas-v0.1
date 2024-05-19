import { FileEntry } from '@/lib/types';
import { UnstructuredClient } from 'unstructured-client';
import * as fs from 'fs';

const apiKey = process.env.UNSTRUCTURED_API as string;

const unstructuredClient = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey,
  },
  serverURL: process.env.UNSTRUCTURED_SERVER_URL, // Optional if you have access to the SaaS platform
});

export async function parseUnstructured(
  file: FileEntry,
  parsingStrategy: string,
  chunkSize: number,
  overlap: number
) {
  const fileData = fs.readFileSync(file.path);
  let parsedDataResponse = await unstructuredClient.general.partition({
    files: {
      content: fileData,
      fileName: file.name,
    },
    strategy: parsingStrategy,
    chunkingStrategy: 'by_title',
    maxCharacters: chunkSize,
    overlap: overlap,
  });
  return parsedDataResponse?.elements || [];
}