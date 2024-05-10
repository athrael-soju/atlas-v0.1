import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileEntry, FileUploadResponse } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.formData();
  const file = data.get('file') as File;
  const userId = data.get('userId') as string;

  const writeFileResponse = await writeFile(file);

  // TODO:Implement a file removal feature.
  // const getUserFIlesResponse = await getUserFiles(userId)
  // console.info('User files:', getUserFIlesResponse)

  const fileData: FileEntry = {
    id: file.name,
    userId: userId,
    name: file.name,
    path: writeFileResponse.path,
    uploadDate: Date.now(),
    contentType: file.type,
  };

  return NextResponse.json({
    message: 'File upload successful',
    userId: userId,
    file: fileData,
    fileWrittenToDisk: writeFileResponse.fileWrittenToDisk,
  });
}

async function writeFile(file: File): Promise<FileUploadResponse> {
  const path = join(tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path, buffer);

  const response = {
    fileWrittenToDisk: true,
    path: path,
  };

  return response;
}
