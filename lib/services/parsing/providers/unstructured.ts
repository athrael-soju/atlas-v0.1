import { AtlasFile } from '@/lib/types';
import { UnstructuredClient } from 'unstructured-client';
import * as fs from 'fs';

const apiKey = process.env.UNSTRUCTURED_API;
const serverURL = process.env.UNSTRUCTURED_SERVER_URL;
const parsingStrategy = process.env.UNSTRUCTURED_PARSING_STRATEGY;
const chunkingStrategy = process.env.UNSTRUCTURED_CHUNKING_STRATEGY;

if (!apiKey) {
  throw new Error('UNSTRUCTURED_API is not set');
}

const unstructuredClient = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey,
  },
  serverURL, // Optional if you have access to the SaaS platform
});

export async function parseUnstructured(
  file: AtlasFile,
  chunkSize: number,
  overlap: number
) {
  try {
    const fileData = fs.readFileSync(file.path);
    const fileContent = file.content as File;
    const parsedDataResponse = await unstructuredClient.general.partition({
      files: {
        content: fileData,
        fileName: fileContent.name,
      },
      strategy: parsingStrategy,
      chunkingStrategy: chunkingStrategy,
      maxCharacters: chunkSize,
      overlap: overlap,
    });

    return parsedDataResponse?.elements || [];
  } catch (error: any) {
    throw new Error('Failed to parse unstructured data', error.message);
  }
}
