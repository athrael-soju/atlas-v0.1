'use client';

import { useRef, useState } from 'react';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import {
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
} from '@/components/ui/icons';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { ExampleMessages } from '@/components/example-messages';
import { useSession } from 'next-auth/react';
import { spinner } from '@/components/ui/spinner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DataTable } from '@/components/data-table';
import { CircleLoader } from 'react-spinners';
import { FileUploadManager } from '@/components/file-upload-manager';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcuts';
import { useFileHandling } from '@/lib/hooks/use-file-handling';
import { MessageForm } from '@/components/message-form';
import { useMessaging } from '@/lib/hooks/use-messaging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default function Page() {
  const { data: session } = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isUploadManagerVisible, setIsUploadManagerVisible] = useState(false);
  const { formRef, onKeyDown } = useEnterSubmit(setIsUploadManagerVisible);

  useKeyboardShortcut(inputRef);

  const userEmail = session?.user?.email ?? '';

  const {
    uploadedFiles,
    fileList,
    isUploadCompleted,
    isLoading,
    handleFileChange,
    handleFetchFiles,
    setIsUploadCompleted,
    setIsLoading,
  } = useFileHandling(userEmail);

  const {
    messages,
    inputValue,
    forgeParams,
    setInputValue,
    submitMessage,
    handleSubmit,
  } = useMessaging({ userEmail, spinner });

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center bg-background p-16">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl text-center font-extrabold mt-4 text-card-foreground">
            Welcome to Atlas
          </h1>
          <p>Log in to proceed</p>
          <img
            src="/atlas.png"
            alt="Atlas Logo"
            className="w-[100%] rounded-full shadow-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className="fixed inset-0 bg-background bg-opacity-25 flex justify-center items-center z-50">
          <CircleLoader color="var(--spinner-color)" size={150} />
        </div>
      )}
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
            <form ref={formRef} onSubmit={handleSubmit}>
              <div
                className="relative p-1 rounded-lg w-full max-w-4xl mb-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xl"
                    onClick={() =>
                      setIsUploadManagerVisible(!isUploadManagerVisible)
                    }
                  >
                    {isUploadManagerVisible ? (
                      <IconChevronUp />
                    ) : (
                      <IconChevronDown />
                    )}
                  </button>
                </div>
                {isUploadManagerVisible && (
                  <FileUploadManager
                    onChange={handleFileChange}
                    userEmail={userEmail}
                    forgeParams={forgeParams}
                    uploadedFiles={uploadedFiles}
                    isUploadCompleted={isUploadCompleted}
                    setIsUploadCompleted={setIsUploadCompleted}
                    fetchFiles={handleFetchFiles}
                    setIsUploading={setIsLoading}
                  />
                )}
              </div>
              <MessageForm
                inputValue={inputValue}
                setInputValue={setInputValue}
                onKeyDown={onKeyDown}
                inputRef={inputRef}
              />
            </form>
          </div>
        </div>
      </div>
      <div className="fixed left-0 top-1/2 transform -translate-y-1/2">
        <Sheet>
          <SheetTrigger>
            <IconChevronRight onClick={() => handleFetchFiles()} />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>File List</SheetTitle>
              <SheetDescription>
                {/* Here you can find all files uploaded by your user account */}
              </SheetDescription>
            </SheetHeader>
            {fileList.length > 0 ? (
              <div>
                <DataTable
                  userEmail={userEmail}
                  files={fileList}
                  handleFetchFiles={handleFetchFiles}
                  setIsDeleting={setIsLoading}
                />
              </div>
            ) : (
              <div>No files uploaded yet.</div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
