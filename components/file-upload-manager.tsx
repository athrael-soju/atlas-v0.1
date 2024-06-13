import React from 'react';
import { Dropzone } from './dropzone';
import { ForgeParams } from '@/lib/types';

interface FileUploadManagerProps {
  onChange: (newFiles: string[]) => void;
  userEmail: string;
  forgeParams: ForgeParams;
  uploadedFiles: string[];
  isUploadCompleted: boolean;
  setIsUploadCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFiles: (userEmail: string) => Promise<void>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  onChange,
  userEmail,
  forgeParams,
  uploadedFiles,
  isUploadCompleted,
  setIsUploadCompleted,
  fetchFiles,
  setIsUploading,
}) => (
  <div>
    <Dropzone
      onChange={onChange}
      userEmail={userEmail}
      forgeParams={forgeParams}
      isUploadCompleted={isUploadCompleted}
      setIsUploadCompleted={setIsUploadCompleted}
      setIsUploading={setIsUploading}
      fetchFiles={fetchFiles}
    />
    {uploadedFiles.length > 0 && (
      <ul className="list-disc pl-5">
        {uploadedFiles.map((file, index) => (
          <li key={`${file}-${index}`}>{file}</li>
        ))}
      </ul>
    )}
  </div>
);
