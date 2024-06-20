import { useState } from 'react';
import { archivist } from '@/lib/client/atlas';
import { AtlasFile, Purpose } from '../types';

const purpose = process.env.NEXT_PUBLIC_ASSISTANT as Purpose;

export const useFileHandling = (
  userEmail: string,
  setIsLoading: (value: boolean) => void
) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fileList, setFileList] = useState<AtlasFile[]>([]);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const handleFileChange = (newFiles: string[]) => {
    setUploadedFiles(newFiles);
  };

  const handleFetchFiles = async () => {
    setIsLoading(true);
    try {
      const onUpdate = (event: string) => {
        const { type, message } = JSON.parse(event.replace('data: ', ''));
        if (type === 'final-notification') {
          setFileList(message);
          setIsLoading(false);
        }
      };
      const archivistParams = { userEmail, purpose };
      await archivist('retrieve-archives', archivistParams, onUpdate);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message);
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
