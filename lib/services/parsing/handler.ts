import { parseUnstructured } from '@/lib/services/parsing/providers/unstructured';
import { AtlasFile } from '@/lib/types';

export async function parse(
  parsingProvider: string,
  minChunkSize: number,
  maxChunkSize: number,
  chunkOverlap: number,
  chunkingStrategy: string,
  partitioningStrategy: string,
  file: AtlasFile
): Promise<any[]> {
  if (parsingProvider === 'io') {
    return await parseUnstructured(
      minChunkSize,
      maxChunkSize,
      chunkOverlap,
      chunkingStrategy,
      partitioningStrategy,
      file
    );
  } else {
    throw new Error(`Unsupported parsing provider: ${parsingProvider}`);
  }
}
