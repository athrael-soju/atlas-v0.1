import { FormEvent, ReactNode, useState } from 'react';
import { AssistantMessage, UserMessage } from '@/components/message';
import { useUIState, useActions } from 'ai/rsc';
import { AI } from '@/app/action';
import { ForgeParams, MessageRole, Purpose } from '../types';
import { toast } from '@/components/ui/use-toast';
import { handleScribe, handleSage } from '@/lib/client/assistants';

export const useMessaging = (
  userEmail: string,
  spinner: JSX.Element,
  purpose: Purpose
) => {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState<string>('');

  const topK = parseInt(process.env.NEXT_PUBLIC_PINECONE_TOPK as string) || 100;
  const topN = parseInt(process.env.NEXT_PUBLIC_COHERE_TOPN as string) || 10;

  const forgeParams: ForgeParams = {
    provider: (process.env.NEXT_PUBLIC_PARSING_PROVIDER as string) || 'local',
    maxChunkSize:
      parseInt(process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE as string) || 1024,
    minChunkSize:
      parseInt(process.env.NEXT_PUBLIC_MIN_CHUNK_SIZE as string) || 256,
    overlap: parseInt(process.env.NEXT_PUBLIC_OVERLAP as string) || 128,
    chunkBatch: parseInt(process.env.NEXT_PUBLIC_CHUNK_BATCH as string) || 150,
    parsingStrategy:
      (process.env.NEXT_PUBLIC_UNSTRUCTURED_PARSING_STRATEGY as string) ||
      'auto',
  };

  const updateLastMessage = (role: MessageRole, content: string) => {
    setMessages((currentMessages) => {
      const newMessages = [...currentMessages];
      newMessages[newMessages.length - 1].display = (
        <AssistantMessage role={role} message={content} />
      );
      return newMessages;
    });
  };

  const addNewMessage = (role: MessageRole, content: ReactNode) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <AssistantMessage role={role} message={content} />,
      },
    ]);
  };

  const submitMessage = async (message: string) => {
    setInputValue('');
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <UserMessage text={message} />,
      },
    ]);
    let context = '';
    // Use Assistants API
    if (process.env.NEXT_PUBLIC_INFERENCE_MODEL === 'assistant') {
      addNewMessage(MessageRole.Spinner, spinner);
      try {
        if (purpose === Purpose.Scribe) {
          await handleScribe(
            userEmail,
            message,
            topK,
            topN,
            updateLastMessage,
            addNewMessage
          );
        } else if (purpose === Purpose.Sage) {
          await handleSage(
            userEmail,
            message,
            updateLastMessage,
            addNewMessage
          );
        }
      } catch (error: any) {
        updateLastMessage(
          MessageRole.Error,
          `Something went wrong while trying to respond. Sorry about that ${userEmail}! If this persists, would you please contact support?`
        );
      }
    } else {
      // Otherwise Completions API is used.
      const responseMessage = await submitUserMessage(message, context);
      setMessages((currentMessages) => [...currentMessages, responseMessage]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (window.innerWidth < 600) {
      (e.target as HTMLFormElement)['message']?.blur();
    }

    const value = inputValue.trim();
    if (!value) return;

    await submitMessage(value);

    console.log('User message:', value);
  };

  return {
    messages,
    inputValue,
    forgeParams,
    setInputValue,
    submitMessage,
    handleSubmit,
  };
};
