import { AtlasFile, FileActionResponse } from '@/lib/types';
import { uploadDocumentLocally, deleteFileFromDisk } from './providers/local';
import { uploadDocumentToOpenAi } from './providers/openai';

class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function handleFileUpload(
  file: File,
  userEmail: string,
  fsProvider: string
): Promise<FileActionResponse> {
  try {
    if (!file || !userEmail) {
      throw new StorageError('Missing file or userEmail');
    }

    if (!fsProvider) {
      throw new StorageError('FILESYSTEM_PROVIDER is not set');
    }

    let fileData: AtlasFile;

    switch (fsProvider) {
      case 'local':
        fileData = await uploadDocumentLocally(file, userEmail);
        break;
      case 'openai':
        fileData = await uploadDocumentToOpenAi(file, userEmail);
        break;
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
    throw new StorageError(`Error uploading file: ${error.message}`);
  }
}

export async function handleFileDeletion(
  file: AtlasFile,
  userEmail: string
): Promise<FileActionResponse> {
  try {
    if (!file || !userEmail) {
      throw new StorageError('Missing file or userEmail');
    }

    const fsProvider = process.env.FILESYSTEM_PROVIDER || 'local';

    switch (fsProvider) {
      case 'local':
        await deleteFileFromDisk(file, userEmail);
        break;
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
    throw new StorageError(`Error deleting file: ${error.message}`);
  }
}
