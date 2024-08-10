import { AtlasFile } from '@/lib/types';
import { UnstructuredClient } from 'unstructured-client';
import * as fs from 'fs';
import {
  ChunkingStrategy,
  Strategy,
} from 'unstructured-client/sdk/models/shared';

const apiKey = process.env.UNSTRUCTURED_API;
const serverURL = process.env.UNSTRUCTURED_SERVER_URL;
const parsingStrategy = process.env.UNSTRUCTURED_PARSING_STRATEGY as Strategy;
const chunkingStrategy = process.env
  .UNSTRUCTURED_CHUNKING_STRATEGY as ChunkingStrategy;

if (!apiKey) {
  throw new Error('UNSTRUCTURED_API is not set');
}

const unstructuredClient = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey,
  },
  serverURL,
});

export async function parseUnstructured(
  file: AtlasFile,
  chunkSize: number,
  overlap: number
) {
  try {
    const fileData = fs.readFileSync(file.path);
    const fileContent = file.content as File;
    const isCsv = fileContent.name.endsWith('.csv');

    const partitionParameters: any = {
      files: {
        content: fileData,
        fileName: fileContent.name,
      },
      strategy: parsingStrategy,
    };

    if (!isCsv) {
      partitionParameters.chunkingStrategy = chunkingStrategy;
      partitionParameters.maxCharacters = chunkSize;
      partitionParameters.overlap = overlap;
      partitionParameters.splitPdfPage = true;
      partitionParameters.splitPdfConcurrencyLevel = 10;
    }

    const parsedDataResponse = await unstructuredClient.general.partition(
      {
        partitionParameters,
      },
      {
        retries: {
          strategy: 'backoff',
          backoff: {
            initialInterval: 1,
            maxInterval: 50,
            exponent: 1.1,
            maxElapsedTime: 100,
          },
          retryConnectionErrors: false,
        },
      }
    );

    return parsedDataResponse?.elements || [];
  } catch (error: any) {
    throw new Error(error.message);
  }
}
