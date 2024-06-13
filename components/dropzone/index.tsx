import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { forge } from '@/lib/client/atlas';
import { DropzoneProps } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export function Dropzone({
  onChange,
  fileExtension,
  userEmail,
  forgeParams,
  isUploadCompleted,
  setIsUploadCompleted,
  fetchFiles,
  setIsDeleting,
  ...props
}: Readonly<DropzoneProps>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast(); // Add this line

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
    }
  };
  // Add File type error handling and return appropriate errors to be shown by the toaster
  const handleUpload = async (files: FileList) => {
    setIsDeleting(true);
    try {
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
        } else if (type === 'final-notification') {
          setProgress(100);
          setIsUploadCompleted(true);
          fetchFiles(userEmail);
          toast({
            title: 'Success',
            description: 'File uploaded successfully.',
            variant: 'default',
          });
        } else if (type === 'error') {
          setError(message);
          toast({
            title: 'Error',
            description: 'Failed to upload file.',
            variant: 'destructive',
          });
        }

        handleFileInfo(message);
      };

      await forge(files, userEmail, forgeParams, onUpdate);
    } catch (error) {
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: 'Failed to upload file.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
          accept={fileExtension ? `.${fileExtension}` : undefined}
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
