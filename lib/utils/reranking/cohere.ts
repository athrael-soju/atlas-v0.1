import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? '',
});

export async function rerank(content: string, queryResults: any, topN: number) {
  const rerankResults = await cohere.rerank({
    model: process.env.COHERE_API_MODEL || 'rerank-multilingual-v3.0',
    documents: queryResults,
    rankFields: [
      'text',
      'filename',
      'filetype',
      'languages',
      'page_number',
      'parent_id',
      'user_email',
    ],
    query: content,
    topN: topN,
    returnDocuments: true,
  });

  const formattedResults = await formatResults(rerankResults.results);

  return {
    message: 'Reranking successful',
    values: formattedResults,
  };
}

async function formatResults(data: any[]) {
  return data
    .map((item) => {
      const record = `Filename: ${item.document.filename}\nFiletype: ${item.document.filetype}\nLanguages: ${item.document.languages}\nPage Number: ${item.document.pageNumber}\nText: ${item.document.text}\nUser Email: ${item.document.userEmail}, Relevance Score: ${item.relevanceScore}`;
      return record;
    })
    .join('\n');
}
