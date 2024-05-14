import { NextRequest, NextResponse } from 'next/server';
import { FileEntry, FileUploadResponse } from '@/lib/types';
import { writeFile as writeLocalFile } from '@/lib/utils/storage/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    const userId = data.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    const fsProvider = process.env.FILESYSTEM_PROVIDER as string;
    let response: FileUploadResponse;

    switch (fsProvider) {
      case 'server':
        response = await writeLocalFile(file);
        break;
      case 's3':
        throw new Error('S3 filesystem provider not implemented');
      default:
        return NextResponse.json(
          { error: 'Invalid filesystem provider' },
          { status: 500 }
        );
    }

    const fileData: FileEntry = {
      id: randomUUID(),
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
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
