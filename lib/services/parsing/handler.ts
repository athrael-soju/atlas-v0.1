import { parseUnstructured } from '@/lib/services/parsing/providers/unstructured';
import { AtlasFile } from '@/lib/types';

export async function parse(
  provider: string,
  minChunkSize: number,
  maxChunkSize: number,
  overlap: number,
  file: AtlasFile
): Promise<any[]> {
  if (provider === 'unstructured') {
    return await parseUnstructured(file, maxChunkSize, overlap);
  } else {
    throw new Error(`Unsupported parsing provider: ${provider}`);
  }
}
