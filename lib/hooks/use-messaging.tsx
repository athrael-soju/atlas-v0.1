import { FormEvent, ReactNode, useState } from 'react';
import { AssistantMessage, UserMessage } from '@/components/message';
import { useUIState, useActions } from 'ai/rsc';
import { AI } from '@/app/action';
import { AtlasUser, ForgeParams, MessageRole, Purpose } from '../types';
import { handleScribe, handleSage } from '@/lib/utils/assistants';
import { useSession } from 'next-auth/react';

export const useMessaging = (
  userEmail: string,
  spinner: JSX.Element,
  purpose: Purpose
) => {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState<string>('');

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
      if (purpose === Purpose.Scribe) {
        await handleScribe(
          userEmail,
          message,
          updateLastMessage,
          addNewMessage
        );
      } else if (purpose === Purpose.Sage) {
        await handleSage(userEmail, message, updateLastMessage, addNewMessage);
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
  };

  return {
    messages,
    inputValue,
    setInputValue,
    submitMessage,
    handleSubmit,
  };
};
