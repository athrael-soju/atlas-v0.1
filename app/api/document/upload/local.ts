import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileUploadResponse } from '@/lib/types';

export async function writeFile(file: File): Promise<FileUploadResponse> {
  const path = join(tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path, buffer);

  const response = {
    filesystem: 'local',
    uploaded: true,
    path: path,
  };

  return response;
}
