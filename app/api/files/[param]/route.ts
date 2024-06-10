import { openai } from '@/lib/client/openai';
import { db } from '@/lib/services/db/mongodb';

export const runtime = 'nodejs';

export async function GET(_request: any, { params: { param } }: any) {
  if (param.includes('@')) {
    // Handle as userEmail
    const dbInstance = await db();
    const user = await dbInstance.getUser(param);
    const fileList = user?.files || [];

    return new Response(JSON.stringify(fileList), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    // Handle as fileId
    const [file, fileContent] = await Promise.all([
      openai.files.retrieve(param),
      openai.files.content(param),
    ]);

    return new Response(fileContent.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${file.filename}"`,
      },
    });
  }
}

export async function POST(_request: any, { params: { fileId } }: any) {
  const [file, fileContent] = await Promise.all([
    openai.files.retrieve(fileId),
    openai.files.content(fileId),
  ]);

  return new Response(fileContent.body, {
    headers: {
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    },
  });
}
