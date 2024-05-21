'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { UserMessage } from '@/components/llm-stocks/message';
import { type AI } from './action';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import Textarea from 'react-textarea-autosize';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconArrowElbow, IconPlus } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { Dropzone } from '@/components/ui/dropzone';
import { oracle } from './services/client/atlas';

export default function Page() {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const userEmail = process.env.NEXT_PUBLIC_USEREMAIL as string;
  const topK = process.env.NEXT_PUBLIC_PINECONE_TOPK as string || '100';
  const topN = process.env.NEXT_PUBLIC_COHERE_TOPN as string || '10';

  const handleFileChange: React.Dispatch<React.SetStateAction<string[]>> = (
    newFiles: React.SetStateAction<string[]>
  ) => {
    setUploadedFiles(newFiles);
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

  return (
    <div>
      <div className="pb-[200px] pt-4 md:pt-10">
        {messages.length ? (
          <>
            <ChatList messages={messages} />
          </>
        ) : (
          <EmptyScreen
            submitMessage={async (message) => {
              setMessages((currentMessages) => [
                ...currentMessages,
                {
                  id: Date.now(),
                  display: <UserMessage>{message}</UserMessage>,
                },
              ]);

              let context = '';
              await oracle(userEmail, message, topK, topN, (update) => {
                context += update + '\n';
              });
              try {
                const responseMessage = await submitUserMessage(message, context);
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
                    display: <UserMessage>Error: {error as ReactNode}</UserMessage>,
                  },
                ]);
              }
            }}
          />
        )}
        <ChatScrollAnchor trackVisibility={true} />
      </div>
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

                setMessages((currentMessages) => [
                  ...currentMessages,
                  {
                    id: Date.now(),
                    display: <UserMessage>{value}</UserMessage>,
                  },
                ]);

                let context = '';
                if (process.env.NEXT_PUBLIC_ENABLE_RAG === 'true') {
                  await oracle(userEmail, value, topK, topN, (update) => {
                    context += update + '\n';
                  });
                }

                try {
                  const responseMessage = await submitUserMessage(value, context);
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
                      display: <UserMessage>Error: {error as ReactNode}</UserMessage>,
                    },
                  ]);
                }
              }}
            >
              <div className="p-5">
                <div>
                  <Dropzone
                    onChange={handleFileChange}
                    fileExtension="pdf"
                    className="your-custom-class"
                    userEmail={userEmail}
                  />
                </div>
              </div>
              <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-secondary px-12 sm:rounded-full sm:px-12">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.reload();
                      }}
                    >
                      <IconPlus />
                      <span className="sr-only">New Chat</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New Chat</TooltipContent>
                </Tooltip>
                <Textarea
                  ref={inputRef}
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  placeholder="Send a message."
                  className="min-h-[60px] w-full bg-transparent placeholder:text-muted-foreground resize-none px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  name="message"
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <div className="absolute right-4 top-[13px] sm:right-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        className="bg-transparent shadow-none text-secondary-foreground rounded-full hover:bg-secondary-foreground/25"
                      >
                        <IconArrowElbow />
                        <span className="sr-only">Send message</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
