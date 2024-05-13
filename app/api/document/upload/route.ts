import { NextRequest, NextResponse } from 'next/server';
import { FileEntry } from '@/lib/types';

import { writeFile } from './local';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.formData();
  const file = data.get('file') as File;
  const userId = data.get('userId') as string;

  const fsProvider = process.env.FILESYSTEM_PROVIDER as string;
  let response: any;
  switch (fsProvider) {
    case 'local':
      response = await writeFile(file);
      break;
    case 's3':
      throw new Error('S3 file upload not implemented');
    default:
  }

  const fileData: FileEntry = {
    id: file.name,
    userId: userId,
    name: file.name,
    path: response.path,
    uploadDate: Date.now(),
    contentType: file.type,
  };

  return NextResponse.json({
    message: 'File upload successful',
    userId: userId,
    file: fileData,
    filesystem: response.filesystem,
    uploaded: response.uploaded,
  });
}
