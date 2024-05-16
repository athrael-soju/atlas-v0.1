import 'server-only';

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import OpenAI from 'openai';

import { spinner, BotMessage } from '@/components/llm-stocks';
import { runOpenAICompletion } from '@/lib/utils';
import { retrieve } from '@/app/services/client/atlas';
import { prompts } from '@/lib/prompts';
import { tools } from '@/lib/stocks/tools';
import { checkIfCalled, confirmPurchase } from '@/lib/stocks/functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function submitUserMessage(content: string) {
  'use server';

  let context;
  // TODO:  User message is submitted to the AI.
  console.info('User: ', content);
  const aiState = getMutableAIState<typeof AI>();
  if (process.env.ENABLE_RAG === 'true') {
    const userEmail = process.env.NEXT_PUBLIC_USEREMAIL as string;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const topK = parseInt(process.env.PINECONE_TOPK as string);
    const topN = parseInt(process.env.COHERE_TOPN as string);

    const onUpdate = (message: string) => {
      console.info('State', message);
      if (message !== undefined) {
        context = message;
      }
    };

    await retrieve(serverUrl, userEmail, content, topK, topN, onUpdate);
  }
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
    <BotMessage className="items-center">{spinner}</BotMessage>
  );

  const profile = process.env.NEXT_PUBLIC_ASSISTANT_PROFILE ?? 'stocks';

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
    reply.update(<BotMessage>{content}</BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);

      // TODO: AI Response finished streaming (When the response is a text stream. GenAI responses can be handled in each function respectively, in lib\chat\stocks\functions.tsx)
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

// Define necessary types and create the AI.

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
