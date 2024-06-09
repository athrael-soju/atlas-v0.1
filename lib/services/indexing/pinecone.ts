import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API as string;
const indexName = process.env.PINECONE_INDEX as string;

if (!apiKey) {
  throw new Error('PINECONE_API is not set');
}

if (!indexName) {
  throw new Error('PINECONE_INDEX is not set');
}

const pineconeClient = new Pinecone({ apiKey });

const getClient = async () => {
  return pineconeClient;
};

const getIndex = async () => {
  const client = await getClient();
  return client.index(indexName);
};

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
      filename: item.metadata.file_name,
      filetype: item.metadata.file_type,
      languages: item.metadata.language,
      pageNumber: item.metadata.pages,
      parentId: item.metadata.parent_id,
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
