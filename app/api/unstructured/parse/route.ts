import { NextRequest, NextResponse } from 'next/server'
import { UnstructuredClient } from 'unstructured-client'
import * as fs from 'fs'

const apiKey = process.env.UNSTRUCTURED_API as string

const client = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey
  },
  serverURL: process.env.UNSTRUCTURED_SERVER_URL // Optional if you have access to the SaaS platform
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { file, parsingStrategy } = await req.json()
  const fileData = fs.readFileSync(file.path)
  let parsedDataResponse = await client.general.partition({
    files: {
      content: fileData,
      fileName: file.name
    },
    strategy: parsingStrategy,
    chunkingStrategy: 'by_title',
    maxCharacters: 1024,
    overlap: 150
  })
  return NextResponse.json({
    message: 'Unstructured Partition Parsed Successfully',
    file: parsedDataResponse?.elements
  })
}
