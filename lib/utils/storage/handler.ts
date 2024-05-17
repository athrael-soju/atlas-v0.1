import { FileEntry, FileActionResponse } from '@/lib/types';
import { writeFile, deleteFile } from '@/lib/utils/storage/local';
import { uploadToS3, deleteFromS3 } from '@/lib/utils/storage/s3';

export async function handleFileUpload(
  file: File,
  userId: string
): Promise<FileActionResponse> {
  try {
    if (!file || !userId) {
      throw new StorageError('Missing file or userId');
    }

    const fsProvider = process.env.FILESYSTEM_PROVIDER;

    if (!fsProvider) {
      throw new StorageError('FILESYSTEM_PROVIDER is not set');
    }

    let fileData: FileEntry;

    switch (fsProvider) {
      case 'server':
        fileData = await writeFile(file, userId);
        break;
      case 's3':
        fileData = await uploadToS3(file, userId);
      default:
        throw new StorageError(
          `Unsupported filesystem provider: ${fsProvider}`
        );
    }

    return {
      message: 'File upload successful',
      file: fileData,
    };
  } catch (error: any) {
    console.error(`Error uploading file: ${error.message}`);
    throw new StorageError(error.message);
  }
}

export async function handleFileDeletion(
  file: FileEntry,
  userId: string
): Promise<FileActionResponse> {
  try {
    if (!file || !userId) {
      throw new StorageError('Missing file or userId');
    }

    const fsProvider = process.env.FILESYSTEM_PROVIDER;

    if (!fsProvider) {
      throw new StorageError('FILESYSTEM_PROVIDER is not set');
    }

    switch (fsProvider) {
      case 'server':
        await deleteFile(file, userId);
        break;
      case 's3':
        await deleteFromS3(file, userId);
      default:
        throw new StorageError(
          `Unsupported filesystem provider: ${fsProvider}`
        );
    }

    return {
      message: 'File deletion successful',
      file: file,
    };
  } catch (error: any) {
    console.error(`Error deleting file: ${error.message}`);
    throw new StorageError(error.message);
  }
}
