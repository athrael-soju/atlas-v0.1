import { parseUnstructured } from '@/lib/services/parsing/providers/unstructured';
import { parseLocal } from '@/lib/services/parsing/providers/local';
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
  } else if (provider === 'local') {
    return await parseLocal(file, minChunkSize, maxChunkSize);
  } else {
    throw new Error(`Unsupported parsing provider: ${provider}`);
  }
}
