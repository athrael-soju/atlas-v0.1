import { openai } from '@/lib/client/openai';

export async function GET(_request: any, { params: { fileId } }: any) {
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
