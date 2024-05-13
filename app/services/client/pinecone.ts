const url = process.env.SERVER_URL || 'http://localhost:3000'

export const query = async (
  userEmail: string,
  embedding: any,
  topK: number
): Promise<any> => {
  const response = await fetch(`${url}/api/pinecone/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userEmail, embedding, topK })
  })
  const jsonResponse = await response.json()
  return jsonResponse
}

export const upsert = async (
  data: any[],
  userEmail: string,
  chunkBatch: number
): Promise<any> => {
  const response = await fetch('/api/pinecone/upsert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data, userEmail, chunkBatch })
  })
  const jsonResponse = await response.json()
  return jsonResponse
}
