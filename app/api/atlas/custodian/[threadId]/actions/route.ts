import { openai } from '@/lib/client/openai';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params: { threadId } }: any
) {
  const { toolCallOutputs, runId } = await request.json();

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}
