import { openai } from '@/lib/client/openai';

export async function POST(
  request: {
    json: () =>
      | PromiseLike<{ toolCallOutputs: any; runId: any }>
      | { toolCallOutputs: any; runId: any };
  },
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
