import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { process } from '@/app/services/client/atlas';

interface DropzoneProps {
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
  fileExtension?: string;
  userEmail: string;
}

export function Dropzone({
  onChange,
  className,
  fileExtension,
  userEmail,
  ...props
}: Readonly<DropzoneProps>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleUpload = async (files: FileList) => {
    try {
      const allowedStates = [
        'Uploading',
        'Parsing',
        'Embedding',
        'Upserting',
        'Cleaning up',
      ];

      const onUpdate = (message: string) => {
        console.log(message);
        if (allowedStates.some((state) => message.startsWith(state))) {
          setProgress((prev) => prev + 20.0 / files.length);
        } else if (message.startsWith('Success')) {
          setProgress(100);
        }

        handleFileInfo(message);
      };

      await process(files, userEmail, onUpdate);
    } catch (error) {
      setError((error as Error).message);
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
          : 'border-input bg-transparent placeholder:text-muted-foreground',
        className
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
            className={`text-${uploadComplete ? 'green-500' : 'muted-foreground'}`}
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
