import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';

export async function uploadDocumentToOpenAi(
  file: File,
  userEmail: string
): Promise<AtlasFile> {
  try {
    const response = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });

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
    await dbInstance.addFile(userEmail, fileData);

    return fileData;
  } catch (error: any) {
    throw new Error('Failed to upload document to OpenAI', error.message);
  }
}
