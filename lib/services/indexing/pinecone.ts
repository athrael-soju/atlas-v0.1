import { getIndex } from '@/lib/client/pinecone';

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export async function query(userEmail: string, embeddings: any, topK: number) {
  try {
    const response = await queryByNamespace(userEmail, topK, embeddings.values);
    const context = response.matches.map((item: any) => ({
      text: item.metadata.text,
      filename: item.metadata.filename,
      filetype: item.metadata.filetype,
      languages: item.metadata.languages,
      pageNumber: item.metadata.page_number,
      userEmail: item.metadata.user_email,
    }));

    return {
      message: 'Pinecone query successful',
      namespace: userEmail,
      context,
    };
  } catch (error: any) {
    throw new Error('Failed to query Pinecone', error.message);
  }
}

const queryByNamespace = async (
  namespace: string,
  topK: number,
  embeddedMessage: any
) => {
  try {
    const index = await getIndex();
    const result = await index.namespace(namespace).query({
      topK: topK,
      vector: embeddedMessage,
      includeValues: false,
      includeMetadata: true,
    });
    return result;
  } catch (error: any) {
    throw new Error('Failed querying by namespace', error.message);
  }
};

export const upsertDocument = async (
  data: any[],
  userEmail: string,
  chunkBatch: number
) => {
  try {
    const index = await getIndex();
    const chunkedData = chunkArray(data, chunkBatch);
    for (const chunk of chunkedData) {
      await index.namespace(userEmail).upsert(chunk);
    }
    return { success: true };
  } catch (error: any) {
    throw new Error('Failed to upsert document', error.message);
  }
};
