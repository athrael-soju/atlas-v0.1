import OpenAI, { ClientOptions } from 'openai'

export const runtime = 'edge'

const embeddingApiModel =
  process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-3-large'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

const options: ClientOptions = { apiKey: process.env.OPENAI_API_KEY }
const openai = new OpenAI(options)

export async function POST(req: Request): Promise<Response> {
  const formData = await req.json()
  const { userEmail, text } = formData

  if (!userEmail || !text) {
    throw new Error('Incomplete request headers.')
  }

  const messageToEmbed = `Date: ${Date.now().toLocaleString}. User: ${userEmail}. Message: ${text}. Metadata: ${''}`
  const response = await openai.embeddings.create({
    model: embeddingApiModel,
    input: messageToEmbed,
    encoding_format: 'float'
  })

  const embeddingValues = response.data[0].embedding

  return Response.json({
    message: 'Message embeddings generated successfully',
    values: embeddingValues
  })
}
