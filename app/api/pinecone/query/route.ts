import { NextRequest, NextResponse } from 'next/server'
import { pinecone } from '@/app/services/server/pinecone'

export const runtime = 'edge'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestBody = await req.json()
  const { userEmail, embedding, topK } = requestBody

  if (userEmail) {
    const response = await pinecone.queryByNamespace(
      userEmail,
      topK,
      embedding.values
    )

    const context = response.matches.map((item: any) => ({
      text: item.metadata.text,
      filename: item.metadata.filename,
      filetype: item.metadata.filetype,
      languages: item.metadata.languages,
      pageNumber: item.metadata.page_number,
      parentId: item.metadata.parent_id,
      userEmail: item.metadata.user_email
    }))

    return NextResponse.json({
      message: 'Pinecone query successful',
      namespace: userEmail,
      context
    })
  } else {
    throw new Error('Query cannot proceed without a valid namespace')
  }
}