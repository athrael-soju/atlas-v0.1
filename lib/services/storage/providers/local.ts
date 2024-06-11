import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { AtlasFile, Purpose } from '@/lib/types';

export async function uploadDocumentLocally(
  file: File,
  userEmail: string
): Promise<AtlasFile> {
  try {
    const path = join(tmpdir(), file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(path, buffer);

    const response: AtlasFile = {
      id: randomUUID(),
      userEmail: userEmail,
      name: file.name,
      content: file,
      path: path,
      uploadDate: Date.now(),
      purpose: Purpose.Scribe,
    };

    return response;
  } catch (error: any) {
    throw new Error('Failed to write file', error.message);
  }
}

export async function deleteFileFromDisk(
  file: AtlasFile,
  userEmail: string
): Promise<void> {
  if (file.userEmail !== userEmail) {
    throw new Error('Unauthorized to delete file');
  }

  try {
    await fs.unlink(file.path);
  } catch (error: any) {
    throw new Error('Failed to delete file', error.message);
  }
}
