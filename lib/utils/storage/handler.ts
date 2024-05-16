import { FileEntry, FileActionResponse } from '@/lib/types';
import { writeFile, deleteFile } from '@/lib/utils/storage/server';

export async function handleFileUpload(
  file: File,
  userId: string
): Promise<FileActionResponse> {
  try {
    if (!file || !userId) {
      throw new Error('Missing file or userId');
    }

    const fsProvider = process.env.FILESYSTEM_PROVIDER as string;
    let fileData: FileEntry;

    switch (fsProvider) {
      case 'server':
        fileData = await writeFile(file, userId);
        break;
      case 's3':
        throw new Error('S3 filesystem provider not implemented');
      default:
        throw new Error('Unsupported filesystem provider');
    }

    return {
      message: 'File upload successful',
      file: fileData,
    };
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    throw new Error(errorMessage);
  }
}

export async function handleFileDeletion(
  file: FileEntry,
  userId: string
): Promise<FileActionResponse> {
  if (!file || !userId) {
    throw new Error('Missing file or userId');
  }

  const fsProvider = process.env.FILESYSTEM_PROVIDER as string;

  switch (fsProvider) {
    case 'server':
      await deleteFile(file, userId);
      break;
    case 's3':
      throw new Error('S3 filesystem provider not implemented');
    default:
      throw new Error('Unsupported filesystem provider');
  }

  return {
    message: 'File deletion successful',
    file: file,
  };
}
