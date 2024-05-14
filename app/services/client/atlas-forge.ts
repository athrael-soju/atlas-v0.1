import { upload } from '@/app/services/client/document';
import { parseDocument } from '@/app/services/client/unstructured';
import { embedDocument } from './openai';
import { upsert } from '@/app/services/client/pinecone';
import { SetStateAction, Dispatch } from 'react';

export const addDocuments = async (
  files: FileList,
  userEmail: string,
  setProgress: Dispatch<SetStateAction<number>>,
  setError: Dispatch<SetStateAction<string | null>>,
  setFileInfo: Dispatch<SetStateAction<string | null>>,
  onAllFilesUploaded: () => void
): Promise<void> => {
  setProgress(0);
  const parsingStrategy = process.env
    .NEXT_PUBLIC_UNSTRUCTURED_PARSING_STRATEGY as string;

  // TODO: Consider uploading all files in one post request and return a list of responses on which the remaining processing can be done.
  const uploadPromises = Array.from(files).map(async (file, index) => {
    try {
      // File can be stored on the server, or in a cloud storage service like S3
      setFileInfo(`Uploading document: ${file.name}...`);
      const uploadResponse = await upload(file, userEmail);
      setProgress((prevProgress) =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      );

      // Parsing can be done using a free library on the server, or a paid service like Unstructured.io
      setFileInfo(`Parsing document: ${file.name}...`);
      const parseResponse = await parseDocument(
        uploadResponse.file,
        parsingStrategy
      ); // 'hi_res' strategy is best used for images
      setProgress((prevProgress) =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      );

      // Possibly provide a selection of models to choose from
      setFileInfo(`Embedding document: ${file.name}...`);
      const embedResponse = await embedDocument(parseResponse.file, userEmail);
      setProgress((prevProgress) =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      );

      // Upsert can be done using an open source service, or a paid like Pinecone
      // This will require client services to connect to APIs.
      setFileInfo(`Indexing document: ${file.name}...`);
      await upsert(embedResponse.embeddings, userEmail, 150);
      setProgress((prevProgress) =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      );

      // Managed depending on the use case.
      setFileInfo(`Cleanup for document: ${file.name}...`);
      setProgress((prevProgress) =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      );

      setFileInfo(`All operations completed for document ${file.name}`);
    } catch (error: any) {
      setError(`Upload failed for file ${file.name}: ${error.message}`);
      throw error;
    }
  });

  try {
    await Promise.all(uploadPromises);
    onAllFilesUploaded();
    setFileInfo('All files processed successfully.');
  } catch (error: any) {
    setError('Failed to process one or more files.');
    setFileInfo('An error occurred during file processing.');
  }
};
