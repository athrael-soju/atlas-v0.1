import { NextRequest, NextResponse } from 'next/server'
import { pinecone } from '@/app/services/server/pinecone'

export const runtime = 'edge'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestBody = await req.json()
  const { data, userEmail, chunkBatch } = requestBody

  if (userEmail) {
    const response = await pinecone.upsert(data, userEmail, chunkBatch)
    if (response.success === false) {
      throw new Error('Pinecone upsert unsuccessful')
    }
    return NextResponse.json({
      message: 'Pinecone upserted successfully',
      response
    })
  } else {
    throw new Error('Upsert cannot proceed without a valid namespace')
  }
}
