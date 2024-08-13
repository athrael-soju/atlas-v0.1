import 'server-only';

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import OpenAI from 'openai';

import { spinner } from '@/components/ui/spinner';
import { AssistantMessage } from '@/components/message';
import { runOpenAICompletion } from '@/lib/utils';
import { prompts } from '@/lib/prompts';
import { tools } from '@/lib/tools';
import { MessageRole } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

export async function submitUserMessage(content: string, context: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content,
    },
    {
      role: 'system',
      content: `Context: ${context}`,
    },
  ]);
  const reply = createStreamableUI(
    <AssistantMessage role={MessageRole.Spinner} message={spinner} />
  );

  const profile = process.env.NEXT_PUBLIC_PERSONA ?? 'atlas';

  const functions =
    process.env.FUNCTIONS_ENABLED === 'true'
      ? tools[profile as keyof typeof tools]
      : [];
  const prompt = prompts[profile as keyof typeof prompts].content;

  const completion = runOpenAICompletion(openai, {
    model: process.env.OPENAI_API_MODEL ?? 'gpt-40-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: functions,
    temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(
      <AssistantMessage role={MessageRole.Text} message={content} />
    );
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);
    }
  });
  process.env.ENABLE_FUNCTIONS === 'true'
    ? checkIfCalled(completion, reply, aiState)
    : '';

  return {
    id: Date.now(),
    display: reply.value,
  };
}

const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialUIState,
  initialAIState,
});

// Tool function definitions go here
export async function checkIfCalled(completion: any, reply: any, aiState: any) {
  // completion.onFunctionCall(
  //   'list_stocks',
  //   async ({ stocks }: ListStocksInfo) => {
  //     reply.update(
  //       <AssistantCard>
  //         <StocksSkeleton />
  //       </AssistantCard>
  //     );
  //     await sleep(1000);
  //     reply.done(
  //       <AssistantCard>
  //         <Stocks stocks={stocks} />
  //       </AssistantCard>
  //     );
  //     aiState.done([
  //       ...aiState.get(),
  //       {
  //         role: 'function',
  //         name: 'list_stocks',
  //         content: JSON.stringify(stocks),
  //       },
  //     ]);
  //   }
  // );
}
