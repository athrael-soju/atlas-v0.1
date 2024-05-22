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

export default function Page() {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userEmail = process.env.NEXT_PUBLIC_USEREMAIL as string;
  const topK = (process.env.NEXT_PUBLIC_PINECONE_TOPK as string) || '100';
  const topN = (process.env.NEXT_PUBLIC_COHERE_TOPN as string) || '10';

  const exampleMessages = [
    {
      heading: 'Could you please explain',
      subheading: 'what Atlas is?',
      message: 'Could you please explain what Atlas is?',
    },
    {
      heading: 'How does Atlas',
      subheading: 'process and store my data?',
      message: 'How does Atlas process and store my data?',
    },
  ];

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
        await oracle(userEmail, message, topK, topN, (update) => {
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

  return (
    <div>
      <div className="pb-[200px] pt-4 md:pt-10">
        {messages.length ? <ChatList messages={messages} /> : <EmptyScreen />}
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
              <div className="mb-4 grid sm:grid-cols-2 gap-2 sm:gap-4 px-4 sm:px-0">
                {exampleMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'cursor-pointer bg-secondary rounded-2xl p-4 sm:p-6 transition-colors'
                    )}
                    onClick={async () => {
                      submitMessage(message.message);
                    }}
                  >
                    <div className="font-medium">{message.heading}</div>
                    <div className="text-sm text-muted-foreground">
                      {message.subheading}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-secondary px-12 sm:rounded-3xl sm:px-12">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMenuOpen((prev) => !prev);
                      }}
                    >
                      <IconPlus />
                      {/* <span className="sr-only">New Chat</span> */}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Options</TooltipContent>
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
            {isMenuOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                  <h3 className="text-lg font-medium text-center">Options</h3>
                  <div className="mt-4 flex flex-col space-y-4">
                    <Button
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      Start New Chat
                    </Button>
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDropzoneOpen(true);
                        setIsUploadCompleted(false);
                      }}
                    >
                      Upload PDF Documents
                    </Button>
                    <hr />
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {isDropzoneOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div
                  className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropzone
                    onChange={handleFileChange}
                    fileExtension="pdf"
                    className="your-custom-class"
                    userEmail={userEmail}
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
                  <div className="mt-4 flex justify-center">
                    <button
                      className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 w-full rounded ${!isUploadCompleted && isUploadStarted ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-400'}`}
                      onClick={() => setIsDropzoneOpen(false)}
                      disabled={!isUploadCompleted && isUploadStarted}
                    >
                      {isUploadCompleted ? 'Ok' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
