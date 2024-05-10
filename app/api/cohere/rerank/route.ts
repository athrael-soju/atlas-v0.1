import { CohereClient } from 'cohere-ai'
import { RerankResponse, RerankResponseResultsItem } from 'cohere-ai/api'

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? ''
})

export const runtime = 'edge'

export async function POST(req: Request): Promise<Response> {
  const formData = await req.json()
  const { prompt, queryResults, topN } = formData

  const rerank = await cohere.rerank({
    model: 'rerank-multilingual-v3.0',
    documents: queryResults,
    rankFields: [
      'text',
      'filename',
      'filetype',
      'languages',
      'page_number',
      'parent_id',
      'user_email'
    ],
    query: prompt,
    topN: topN,
    returnDocuments: true
  })

  const formattedResults = await formatResults(rerank.results)

  return Response.json({
    message: 'Reranking successful',
    values: formattedResults
  })
}

async function formatResults(data: any[]) {
  return data
    .map(item => {
      return `Filename: ${item.document.filename}, Filetype: ${item.document.filetype}, Languages: ${item.document.languages.join(', ')}, Page Number: ${item.document.pageNumber}, Text: ${item.document.text}, User Email: ${item.document.userEmail}, Relevance Score: ${item.relevanceScore}`
    })
    .join('\n')
}
