'use client';

import { useState } from 'react';
import { Dropzone } from '@/components/ui/dropzone';

interface UploadProps {
  onComplete: () => void;
  onCancel: () => void;
  forgeParams: any;
}

export function Upload({
  onComplete,
  onCancel,
  forgeParams,
}: Readonly<UploadProps>) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploadCompleted, setIsUploadCompleted] = useState(false);
  const [isUploadStarted, setIsUploadStarted] = useState(false);

  const handleFileChange: React.Dispatch<React.SetStateAction<string[]>> = (
    newFiles: React.SetStateAction<string[]>
  ) => {
    setUploadedFiles(newFiles);
    setIsUploadCompleted(true); // Assuming file upload is instant for this example
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <Dropzone
          onChange={handleFileChange}
          fileExtension="pdf"
          className="your-custom-class"
          forgeParams={forgeParams}
          isUploadCompleted={isUploadCompleted}
          setIsUploadCompleted={setIsUploadCompleted}
          setIsUploadStarted={setIsUploadStarted}
        />
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Uploaded Files</h3>
            <ul className="list-disc pl-5">
              {uploadedFiles.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <button
            className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 w-full rounded ${
              !isUploadCompleted && isUploadStarted
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gray-400'
            }`}
            onClick={isUploadCompleted ? onComplete : onCancel}
            disabled={!isUploadCompleted && isUploadStarted}
          >
            {isUploadCompleted ? 'Ok' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
