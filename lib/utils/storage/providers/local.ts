import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { FileEntry } from '@/lib/types';

export async function writeFile(
  file: File,
  userEmail: string
): Promise<FileEntry> {
  const path = join(tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path, buffer);

  const response: FileEntry = {
    id: randomUUID(),
    userEmail: userEmail,
    name: file.name,
    path: path,
    uploadDate: Date.now(),
    contentType: file.type,
  };

  return response;
}

export async function deleteFile(
  file: FileEntry,
  userEmail: string
): Promise<void> {
  if (file.userEmail !== userEmail) {
    throw new Error('Unauthorized');
  }
}
