import { uploadFile } from '@/app/services/client/fs-file-service'
import { parseDocument } from '@/app/services/client/unstructured'
import { embedDocument } from './openai'
import { upsert } from '@/app/services/client/pinecone'
import { SetStateAction, Dispatch } from 'react'

export const handleFiles = async (
  files: FileList,
  userEmail: string,
  setProgress: Dispatch<SetStateAction<number>>,
  setError: Dispatch<SetStateAction<string | null>>,
  setFileInfo: Dispatch<SetStateAction<string | null>>,
  onAllFilesUploaded: () => void
): Promise<void> => {
  setProgress(0)
  const uploadPromises = Array.from(files).map(async (file, index) => {
    try {
      setFileInfo(`Uploading document: ${file.name}...`)
      const uploadResponse = await uploadFile(file, userEmail)
      setProgress(prevProgress =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      )

      setFileInfo(`Parsing document: ${file.name}...`)
      const parseResponse = await parseDocument(uploadResponse.file, 'auto') // 'hi_res' strategy is best used for images
      setProgress(prevProgress =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      )

      setFileInfo(`Embedding document: ${file.name}...`)
      const embedResponse = await embedDocument(parseResponse.file, userEmail)
      setProgress(prevProgress =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      )

      setFileInfo(`Indexing document: ${file.name}...`)
      await upsert(embedResponse.embeddings, userEmail, 150)
      setProgress(prevProgress =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      )

      setFileInfo(`Cleanup for document: ${file.name}...`)
      setProgress(prevProgress =>
        Math.min(prevProgress + 100 / files.length / 5, 100)
      )

      setFileInfo(`All operations completed for document ${file.name}`)
    } catch (error: any) {
      setError(`Upload failed for file ${file.name}: ${error.message}`)
      throw error
    }
  })

  try {
    await Promise.all(uploadPromises)
    onAllFilesUploaded()
    setFileInfo('All files processed successfully.')
  } catch (error: any) {
    setError('Failed to process one or more files.')
    setFileInfo('An error occurred during file processing.')
  }
}
