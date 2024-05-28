'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { UserMessage } from '@/components/llm-stocks/message';
import { type AI } from './action';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import Textarea from 'react-textarea-autosize';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { Upload } from '@/components/chat/Upload';
import { oracle } from './services/client/atlas';
import { ExampleMessages } from '@/components/chat/ExampleMessages';
import { Selection } from '@/components/chat/Selection';
import {
  TooltipButton,
  SendMessageButton,
} from '@/components/common/TooltipButton';

export default function Page() {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<'select' | 'upload' | 'chat' | 'analyze'>(
    'select'
  );
  const [showExampleMessages, setShowExampleMessages] = useState(true);

  const userEmail = process.env.NEXT_PUBLIC_USER_EMAIL as string;

  const oracleParams = {
    userEmail: userEmail,
    topK: parseInt(process.env.NEXT_PUBLIC_PINECONE_TOPK as string) || 100,
    topN: parseInt(process.env.NEXT_PUBLIC_COHERE_TOPN as string) || 10,
  };

  const forgeParams = {
    userEmail: userEmail,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (
          e.target &&
          ['INPUT', 'TEXTAREA'].includes((e.target as any).nodeName)
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);

  const submitMessage = async (message: string) => {
    setShowExampleMessages(false);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <UserMessage>{message}</UserMessage>,
      },
    ]);

    let context = '';
    if (process.env.NEXT_PUBLIC_ENABLE_RAG === 'true') {
      await oracle(message, oracleParams, (update) => {
        context += update + '\n';
      });
    }
    try {
      const responseMessage = await submitUserMessage(message, context);
      setMessages((currentMessages) => [...currentMessages, responseMessage]);
    } catch (error) {
      console.error(error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          display: <UserMessage>Error: {error as ReactNode}</UserMessage>,
        },
      ]);
    }
  };

  return (
    <div>
      {view === 'select' && (
        <div className="pt-4 md:pt-10">
          <EmptyScreen />
          <Selection setView={setView} />
        </div>
      )}
      {view === 'upload' && (
        <Upload
          onComplete={() => setView('select')}
          onCancel={() => setView('select')}
          forgeParams={forgeParams}
        />
      )}
      {view === 'chat' && (
        <div className="pt-4 md:pt-10">
          {messages.length ? <ChatList messages={messages} /> : null}
          <ChatScrollAnchor trackVisibility={true} />
          <div className="fixed inset-x-0 bottom-0 w-full duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] dark:from-10%">
            <div className="mx-auto sm:max-w-2xl sm:px-4">
              <div className="mb-4 grid gap-2 sm:gap-4 px-4 sm:px-0">
                <form
                  ref={formRef}
                  onSubmit={async (e: any) => {
                    e.preventDefault();

                    if (window.innerWidth < 600) {
                      e.target['message']?.blur();
                    }

                    const value = inputValue.trim();
                    setInputValue('');
                    if (!value) return;

                    setShowExampleMessages(false);
                    setMessages((currentMessages) => [
                      ...currentMessages,
                      {
                        id: Date.now(),
                        display: <UserMessage>{value}</UserMessage>,
                      },
                    ]);

                    let context = '';
                    if (process.env.NEXT_PUBLIC_ENABLE_RAG === 'true') {
                      await oracle(value, oracleParams, (update) => {
                        context += update + '\n';
                      });
                    }

                    try {
                      const responseMessage = await submitUserMessage(
                        value,
                        context
                      );
                      setMessages((currentMessages) => [
                        ...currentMessages,
                        responseMessage,
                      ]);
                    } catch (error) {
                      console.error(error);
                      setMessages((currentMessages) => [
                        ...currentMessages,
                        {
                          id: Date.now() + 1,
                          display: (
                            <UserMessage>
                              Error: {error as ReactNode}
                            </UserMessage>
                          ),
                        },
                      ]);
                    }
                  }}
                >
                  {showExampleMessages && (
                    <ExampleMessages onClick={submitMessage} />
                  )}
                  <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-secondary px-12 sm:rounded-3xl sm:px-12">
                    <TooltipButton setView={setView} />
                    <Textarea
                      ref={inputRef}
                      tabIndex={0}
                      onKeyDown={onKeyDown}
                      placeholder="Send a message."
                      className="min-h-[60px] w-full bg-transparent placeholder:text-muted-foreground resize-none px-8 py-[1.3rem] focus-within:outline-none sm:text-sm"
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      name="message"
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <div className="absolute right-4 top-[13px] sm:right-4 flex items-center space-x-1">
                      <SendMessageButton />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
