import { useState } from 'react';
import { archivist } from '@/lib/client/atlas';
import { AtlasFile, Purpose } from '../types';
import { toast } from '@/components/ui/use-toast';

export const useFileHandling = (
  userEmail: string,
  purpose: Purpose,
  setIsLoading: (value: boolean) => void
) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fileList, setFileList] = useState<AtlasFile[]>([]);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const handleFileChange = (newFiles: string[]) => {
    setUploadedFiles(newFiles);
  };

  const handleFetchFiles = async () => {
    try {
      setIsLoading(true);
      const onUpdate = (event: string) => {
        const { type, message } = JSON.parse(event.replace('data: ', ''));
        if (type === 'final-notification') {
          setFileList(message);
          setIsLoading(false);
        } else if (type === 'error') {
          toast({
            title: 'Error',
            description: `Failed to onboard: ${message}`,
            variant: 'destructive',
          });
        }
      };

      const archivistParams = { purpose };
      await archivist(
        userEmail,
        'retrieve-archives',
        archivistParams,
        onUpdate
      );
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadedFiles,
    fileList,
    isUploadCompleted,
    purpose,
    handleFileChange,
    handleFetchFiles,
    setIsUploadCompleted,
  };
};
