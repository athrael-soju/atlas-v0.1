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
import { cn } from '@/lib/utils';
import { ExampleMessages } from '@/components/example-messages';

export default function Page() {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const [isUploadStarted, setIsUploadStarted] = useState(false);

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

  const handleFileChange: React.Dispatch<React.SetStateAction<string[]>> = (
    newFiles: React.SetStateAction<string[]>
  ) => {
    setUploadedFiles(newFiles);
    setIsUploadCompleted(true); // Assuming file upload is instant for this example
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
    setInputValue(message);
    {
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
    }
  };
  console.log('messages', messages);
  return (
    <div>
      <div className="pb-[200px] pt-4 md:pt-10">
        {messages.length ? <ChatList messages={messages} /> : <EmptyScreen />}
        <ChatScrollAnchor trackVisibility={true} />
      </div>
      <div className="fixed inset-x-0 bottom-0 w-full duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] dark:from-10%">
        <div className="mx-auto sm:max-w-2xl sm:px-4">
          {messages.length === 0 ? (
            <ExampleMessages onClick={submitMessage} />
          ) : null}
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
                        <UserMessage>Error: {error as ReactNode}</UserMessage>
                      ),
                    },
                  ]);
                }
              }}
            >
              <button
                className="relative p-2 rounded-lg w-full max-w-4xl mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Dropzone
                  onChange={handleFileChange}
                  fileExtension="pdf"
                  className="your-custom-class"
                  forgeParams={forgeParams}
                  isUploadCompleted={isUploadCompleted}
                  setIsUploadCompleted={setIsUploadCompleted}
                  setIsUploadStarted={setIsUploadStarted}
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">Uploaded Files</h3>
                    <ul className="list-disc pl-5">
                      {uploadedFiles.map((file, index) => (
                        <li key={index}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </button>

              <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-secondary px-12 sm:rounded-3xl sm:px-12">
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
                      {/* <span className="sr-only">New Chat</span> */}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New Chat</TooltipContent>
                </Tooltip>
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
