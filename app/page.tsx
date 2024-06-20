'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CircleLoader } from 'react-spinners';
import { ChatScrollAnchor } from '@/lib/hooks/chat-scroll-anchor';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcuts';
import { useFileHandling } from '@/lib/hooks/use-file-handling';
import { useMessaging } from '@/lib/hooks/use-messaging';
import {
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
} from '@/components/ui/icons';
import { ChatList } from '@/components/chat-list';
import { EmptyScreen } from '@/components/empty-screen';
import { ExampleMessages } from '@/components/example-messages';
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
import { FileUploadManager } from '@/components/file-upload-manager';
import { MessageForm } from '@/components/message-form';
import { OnboardingCarousel } from '@/components/onboarding';
import { AtlasUser } from '@/lib/types';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default function Page() {
  const { data: session } = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isUploadManagerVisible, setIsUploadManagerVisible] =
    useState<boolean>(false);
  const { formRef, onKeyDown } = useEnterSubmit(setIsUploadManagerVisible);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useKeyboardShortcut(inputRef);

  const user = session?.user as AtlasUser;
  const userEmail = user?.email ?? '';

  const [isOnboardingComplete, setIsOnboardingComplete] =
    useState<boolean>(false);

  useEffect(() => {
    if (user && user.preferences) {
      setIsOnboardingComplete(!!user.preferences.selectedAssistant);
    }
  }, [user]);

  const {
    uploadedFiles,
    fileList,
    isUploadCompleted,
    purpose,
    handleFileChange,
    handleFetchFiles,
    setIsUploadCompleted,
  } = useFileHandling(userEmail, setIsLoading);

  const {
    messages,
    inputValue,
    forgeParams,
    setInputValue,
    submitMessage,
    handleSubmit,
  } = useMessaging({ userEmail, spinner, purpose });

  const HandleLoader = () => {
    return (
      <div>
        {isLoading && (
          <div className="fixed inset-0 bg-background bg-opacity-25 flex justify-center items-center z-50">
            <CircleLoader color="var(--spinner-color)" size={150} />
          </div>
        )}
      </div>
    );
  };

  if (!session) {
    return (
      <div>
        <Header />
        <div className="flex flex-col items-center justify-center p-24">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl text-center font-extrabold mt-4 text-card-foreground ">
              Welcome to Atlas
            </h1>
            <p>Log in to proceed</p>
            <img
              src="/atlas.png"
              alt="Atlas Logo"
              className="w-full rounded-full shadow-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <div>
        <Header />
        <HandleLoader />
        <div className="flex items-center justify-center p-24">
          <OnboardingCarousel
            userEmail={userEmail}
            setIsOnboardingComplete={setIsOnboardingComplete}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <HandleLoader />
      <div className="pb-52 pt-4 md:pt-10">
        {messages.length ? <ChatList messages={messages} /> : <EmptyScreen />}
        <ChatScrollAnchor trackVisibility={true} />
      </div>
      <div className="fixed inset-x-0 bottom-0 w-full">
        <div className="mx-auto sm:max-w-2xl sm:px-4">
          {!messages.length && <ExampleMessages onClick={submitMessage} />}
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
                <div
                  className={`transition-opacity duration-500 ${
                    isUploadManagerVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {isUploadManagerVisible && (
                    <FileUploadManager
                      purpose={purpose}
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
              <DataTable
                userEmail={userEmail}
                files={fileList}
                purpose={purpose}
                handleFetchFiles={handleFetchFiles}
                setIsDeleting={setIsLoading}
              />
            ) : (
              <div>No files uploaded yet.</div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
