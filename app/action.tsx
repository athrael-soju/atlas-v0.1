import 'server-only';

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import OpenAI from 'openai';

import { spinner } from '@/components/ui/spinner';
import { AssistantMessage } from '@/components/message';
import { runOpenAICompletion } from '@/lib/utils';
import { prompts } from '@/lib/prompts';
import { tools } from '@/lib/stocks/tools';
import {
  checkIfCalled,
  confirmPurchase,
} from '@/components/examples/llm-stocks/functions';
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
    <AssistantMessage
      role={MessageRole.Spinner}
      text={spinner}
      className="items-center"
    />
  );

  const profile = process.env.NEXT_PUBLIC_PERSONA ?? 'atlas';

  const functions =
    process.env.FUNCTIONS_ENABLED === 'true'
      ? tools[profile as keyof typeof tools]
      : [];
  const prompt = prompts[profile as keyof typeof prompts].content;

  const completion = runOpenAICompletion(openai, {
    model: process.env.OPENAI_API_MODEL ?? 'gpt-3.5-turbo',
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
    reply.update(<AssistantMessage role={MessageRole.Text} text={content} />);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);

      console.info('AI: ', content);
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
    confirmPurchase,
  },
  initialUIState,
  initialAIState,
});
