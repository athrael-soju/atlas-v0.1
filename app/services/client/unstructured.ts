import { FileEntry } from '@/lib/types'

const url = process.env.SERVER_URL || 'http://localhost:3000'

export const parseDocument = async (
  file: FileEntry,
  parsingStrategy: string
): Promise<any> => {
  const response = await fetch(`${url}/api/unstructured/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file, parsingStrategy })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  const jsonResponse = await response.json()
  return jsonResponse
}
