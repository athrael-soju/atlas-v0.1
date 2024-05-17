import { FileEntry } from '@/lib/types';

// Placeholder for S3 implementation
export async function uploadToS3(
  file: File,
  userId: string
): Promise<FileEntry> {
  throw new StorageError('S3 filesystem provider not implemented');
}

export async function deleteFromS3(
  file: FileEntry,
  userId: string
): Promise<void> {
  throw new StorageError('S3 filesystem provider not implemented');
}
