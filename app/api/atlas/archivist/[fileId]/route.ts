import { openai } from '@/lib/client/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
