import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { ClientOptions } from 'openai'

export const runtime = 'edge'

const embeddingApiModel =
  process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-3-large'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

const options: ClientOptions = { apiKey: process.env.OPENAI_API_KEY }
const openai = new OpenAI(options)

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestBody = await req.json()
  const { data, userEmail } = requestBody

  const chunkIdList: string[] = []

  const embeddings = await Promise.all(
    data.map(async (item: any) => {
      delay(13) // Temporary fix for rate limiting 5000 RPM
      const response = await openai.embeddings.create({
        model: embeddingApiModel,
        input: item.text,
        encoding_format: 'float'
      })
      const transformedMetadata = transformObjectValues(item.metadata)
      const newId = crypto.randomUUID()
      chunkIdList.push(newId)
      const embeddingValues = response.data[0].embedding
      return {
        id: newId,
        values: embeddingValues,
        metadata: {
          ...transformedMetadata,
          text: item.text,
          user_email: userEmail
        }
      }
    })
  )

  return NextResponse.json({
    message: 'Embeddings generated successfully',
    chunks: chunkIdList,
    embeddings: embeddings
  })
}

const transformObjectValues = (
  obj: Record<string, any>
): Record<string, any> => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (typeof value === 'object' && value !== null) {
        acc[key] = Object.entries(value).map(
          ([k, v]) => `${k}:${JSON.stringify(v)}`
        )
      } else {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )
}
