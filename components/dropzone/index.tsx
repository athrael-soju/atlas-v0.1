import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { forge } from '@/lib/client/atlas';
import { DropzoneProps } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { allowedFileTypes } from '@/lib/utils/allowed-file-types';
export function Dropzone({
  userEmail,
  assistantSelected,
  forgeParams,
  isUploadCompleted,
  onChange,
  setIsUploadCompleted,
  setIsUploading,
  fetchFiles,
  ...props
}: Readonly<DropzoneProps>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const { files } = e.dataTransfer;
    await handleUpload(files);
  };

  const handleFileInfo = (info: string) => {
    setFileInfo(info);
  };

  const resetProgressAndError = () => {
    setProgress(0);
    setFileInfo(null);
    setError(null);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    resetProgressAndError();
    const { files } = e.target;
    if (files) {
      await handleUpload(files);
    } else {
      toast({
        title: 'Error',
        description: 'No files selected.',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);

    try {
      Array.from(files).filter((file) => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (
          !fileExtension ||
          !allowedFileTypes[assistantSelected].extensions.includes(
            fileExtension
          )
        ) {
          throw new Error(`File type not allowed: ${fileExtension}`);
        }
      });

      const allowedStates = [
        'Uploading',
        'Updating DB',
        'Parsing',
        'Embedding',
        'Upserting',
        'Cleaning up',
      ];

      const progressInterval = 100 / allowedStates.length / files.length;
      const onUpdate = (event: string) => {
        const { type, message } = JSON.parse(event.replace('data: ', ''));
        if (allowedStates.some((state) => message.startsWith(state))) {
          setProgress((prev) => prev + progressInterval);
        }

        if (type === 'error') {
          setIsUploadCompleted(false);
          fetchFiles(userEmail);
          toast({
            title: 'Error',
            description: `Failed to upload file(s): ${message}`,
            variant: 'destructive',
          });
        } else if (type === 'final-notification') {
          setProgress(100);
          setIsUploadCompleted(true);
          fetchFiles(userEmail);
          toast({
            title: 'Success',
            description: 'File(s) uploaded successfully.',
            variant: 'default',
          });
        }
        handleFileInfo(message);
      };

      await forge(files, userEmail, assistantSelected, forgeParams, onUpdate);
    } catch (error: any) {
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: `Failed to upload file(s): ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={cn(
        'flex w-full rounded-lg border border-dashed px-3 py-2 text-sm shadow-sm',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isDragging
          ? 'border-blue-500'
          : 'border-input bg-transparent placeholder:text-muted-foreground'
      )}
      {...props}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center space-y-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFileTypes[assistantSelected].extensions
            .map((type) => `.${type}`)
            .join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
        />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handleButtonClick}
        >
          <strong>Click Here</strong>, or Drag Files to Upload
        </Button>
        {fileInfo && (
          <p
            className={`text-${isUploadCompleted ? 'green-500' : 'muted-foreground'}`}
          >
            {fileInfo}
          </p>
        )}
        {error && <span className="text-red-500">{error}</span>}
        <Progress value={progress} className="w-full" />
      </CardContent>
    </Card>
  );
}
