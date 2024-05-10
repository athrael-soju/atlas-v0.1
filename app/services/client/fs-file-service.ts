export async function uploadFile(file: File, userId: string): Promise<any> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('userId', userId)

  const url = process.env.SERVER_URL || 'http://localhost:3000'
  const response = await fetch(`${url}/api/file-upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
