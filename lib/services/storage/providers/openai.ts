import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { updateSage } from '../../processing/openai';

export async function uploadDocumentToOpenAi(
  file: File,
  userEmail: string
): Promise<AtlasFile> {
  try {
    const response = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });

    if (!response) {
      throw new Error('Failed to upload document to OpenAI');
    }

    const fileData: AtlasFile = {
      id: response.id,
      userEmail: userEmail,
      content: file,
      name: file.name,
      path: response.filename,
      uploadDate: Date.now(),
      purpose: Purpose.Sage,
    };

    const dbInstance = await db();
    const addedFIle = await dbInstance.addFile(userEmail, fileData);

    if (!addedFIle) {
      throw new Error('Failed to add file to database');
    }

    const updatedSage = await updateSage(dbInstance, userEmail);

    if (!updatedSage) {
      throw new Error('Failed to update Sage');
    }

    return fileData;
  } catch (error: any) {
    throw new Error('Failed to upload document to OpenAI', error.message);
  }
}
