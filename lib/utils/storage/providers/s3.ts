import { FileEntry } from '@/lib/types';

// Placeholder for S3 implementation
export async function uploadToS3(
  file: File,
  userEmail: string
): Promise<FileEntry> {
  throw new StorageError('S3 filesystem provider not implemented');
}

export async function deleteFromS3(
  file: FileEntry,
  userEmail: string
): Promise<void> {
  throw new StorageError('S3 filesystem provider not implemented');
}
