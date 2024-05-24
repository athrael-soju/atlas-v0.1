import { parseUnstructured } from '@/lib/utils/parsing/providers/unstructured';
import { parseLocal } from '@/lib/utils/parsing/providers/local';
import { FileEntry } from '@/lib/types';

export async function parse(
  provider: string,
  minChunkSize: number,
  maxChunkSize: number,
  overlap: number,
  file: FileEntry
): Promise<any[]> {
  if (provider === 'unstructured') {
    return await parseUnstructured(file, maxChunkSize, overlap);
  } else if (provider === 'local') {
    return await parseLocal(file, minChunkSize, maxChunkSize);
  } else {
    throw new Error(`Unsupported parsing provider: ${provider}`);
  }
}
