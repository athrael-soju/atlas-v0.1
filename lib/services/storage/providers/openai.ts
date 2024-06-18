import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { updateSage } from '../../processing/openai';

export async function uploadDocumentToOpenAi(
  file: File,
  userEmail: string
): Promise<AtlasFile> {
  const dbInstance = await db();
  let fileId;
  try {
    const response = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });

    if (!response) {
      throw new Error('Failed to upload document to OpenAI');
    }
    fileId = response.id;
    const fileData: AtlasFile = {
      id: fileId,
      userEmail: userEmail,
      content: file,
      name: file.name,
      path: response.filename,
      uploadDate: Date.now(),
      purpose: Purpose.Sage,
    };

    const addedFIle = await dbInstance.insertArchive(
      userEmail,
      Purpose.Sage,
      fileData
    );

    if (!addedFIle) {
      throw new Error('Failed to add file to database');
    }

    const updatedSage = await updateSage(dbInstance, userEmail);

    if (!updatedSage) {
      throw new Error('Failed to update Sage');
    }

    return fileData;
  } catch (error: any) {
    // Rollback changes
    await openai.files.del(fileId!);
    await dbInstance.purgeArchive(userEmail, Purpose.Sage, fileId!);

    throw new Error(`${error.message}. Rolling back changes...`);
  }
}
