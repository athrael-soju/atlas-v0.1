import React from 'react';
import { Dropzone } from './dropzone';
import { ForgeParams, Purpose } from '@/lib/types';

interface FileUploadManagerProps {
  onChange: (newFiles: string[]) => void;
  assistantSelected: Purpose | null;
  userEmail: string;
  forgeParams: ForgeParams;
  uploadedFiles: string[];
  isUploadCompleted: boolean;
  setIsUploadCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFiles: (userEmail: string) => Promise<void>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  userEmail,
  assistantSelected,
  forgeParams,
  uploadedFiles,
  isUploadCompleted,
  onChange,
  setIsUploadCompleted,
  fetchFiles,
  setIsUploading,
}) => {
  const allowedFileTypes =
    assistantSelected === Purpose.Sage
      ? 'csv'
      : assistantSelected === Purpose.Scribe
        ? 'pdf'
        : '';

  return (
    <div>
      <Dropzone
        userEmail={userEmail}
        forgeParams={forgeParams}
        fileExtension={allowedFileTypes}
        isUploadCompleted={isUploadCompleted}
        onChange={onChange}
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
};
