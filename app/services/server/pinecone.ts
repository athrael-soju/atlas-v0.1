import { Pinecone } from '@pinecone-database/pinecone'

const apiKey = process.env.PINECONE_API as string,
  indexName = process.env.PINECONE_INDEX as string

const pineconeClient = new Pinecone({ apiKey })

const getClient = async () => {
  return pineconeClient
}

const getIndex = async () => {
  const client = await getClient()
  return client.index(indexName)
}

const queryByNamespace = async (
  namespace: string,
  topK: number,
  embeddedMessage: any
) => {
  const index = await getIndex()
  const result = await index.namespace(namespace).query({
    topK: topK,
    vector: embeddedMessage,
    includeValues: false,
    includeMetadata: true
    //filter: { genre: { $eq: 'action' } },
  })
  return result
}

function chunkArray(array: any[], chunkSize: number): any[][] {
  const result: any[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}

const upsert = async (data: any[], userEmail: string, chunkBatch: number) => {
  const index = await getIndex()
  const chunkedData = chunkArray(data, chunkBatch)
  for (const chunk of chunkedData) {
    await index.namespace(userEmail).upsert(chunk)
  }
  return { success: true }
}

export const pinecone = {
  queryByNamespace,
  upsert
}
