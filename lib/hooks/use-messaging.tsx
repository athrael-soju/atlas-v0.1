import { FormEvent, ReactNode, useState } from 'react';
import { scribe, sage } from '../client/atlas';
import { AssistantMessage, UserMessage } from '@/components/message';
import { useUIState, useActions } from 'ai/rsc';
import { AI } from '@/app/action';
import { ScribeParams, ForgeParams, MessageRole, Purpose } from '../types';

interface UseMessagingProps {
  userEmail: string;
  spinner: JSX.Element;
  purpose: Purpose;
}

export const useMessaging = ({
  userEmail,
  spinner,
  purpose,
}: UseMessagingProps) => {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState<string>('');

  const scribeParams: ScribeParams = {
    userEmail,
    topK: parseInt(process.env.NEXT_PUBLIC_PINECONE_TOPK as string) || 100,
    topN: parseInt(process.env.NEXT_PUBLIC_COHERE_TOPN as string) || 10,
  };

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
        <AssistantMessage role={role} text={content} />
      );
      return newMessages;
    });
  };

  const addNewMessage = (role: MessageRole, content: ReactNode) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: (
          <AssistantMessage
            role={role}
            text={content}
            className="items-center"
          />
        ),
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
    if (process.env.NEXT_PUBLIC_INFERENCE_MODEL === 'assistant') {
      try {
        // If the purpose is Scribe, context is retrieved via RAG
        if (purpose === Purpose.Scribe) {
          await scribe(message, scribeParams, (event) => {
            const { type, message } = JSON.parse(event.replace('data: ', ''));
            if (type === 'final-notification' && message !== '[]') {
              context = message;
            }
          });
        }
        // Use Scribe or Sage, depending on the purpose
        addNewMessage(MessageRole.Spinner, spinner);
        let firstRun = true;
        let prevType: MessageRole.Text | MessageRole.Code | MessageRole.Image;
        let currentMessage: string = '';
        const params = { message, context };
        await sage(userEmail, purpose, params, (event: string) => {
          const { type, message } = JSON.parse(event.replace('data: ', ''));
          if (type.includes('created') && firstRun === false) {
            addNewMessage(prevType, currentMessage);
            if (type === 'text_created') {
              prevType = MessageRole.Text;
            } else if (type === 'tool_created') {
              prevType = MessageRole.Code;
            }
            currentMessage = '';
          } else if (
            [MessageRole.Text, MessageRole.Code, MessageRole.Image].includes(
              type
            )
          ) {
            currentMessage += message;
            prevType = type;
            firstRun = false;
            updateLastMessage(type, currentMessage);
          }
        });
      } catch (error: any) {
        addNewMessage(
          MessageRole.Error,
          <AssistantMessage role={MessageRole.Text} text={error.message} />
        );
      }
    } else {
      // Otherwise completions is used.
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
