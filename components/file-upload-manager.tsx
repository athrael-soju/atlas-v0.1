import React from 'react';
import { Dropzone } from './dropzone';
import { FileUploadManagerProps } from '@/lib/types';

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  userEmail,
  assistantSelected,
  uploadedFiles,
  isUploadCompleted,
  onChange,
  setIsUploadCompleted,
  fetchFiles,
  setIsUploading,
}) => {
  return (
    <div>
      <Dropzone
        userEmail={userEmail}
        assistantSelected={assistantSelected}
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
