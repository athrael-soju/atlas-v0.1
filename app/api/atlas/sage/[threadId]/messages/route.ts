import { openai } from '@/lib/client/openai';

export const runtime = 'nodejs';

// Send a new message to a thread
export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
): Promise<Response> {
  const { content, sageId }: { content: string; sageId: string } =
    await request.json();

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: sageId,
  });

  return new Response(stream.toReadableStream());
}
