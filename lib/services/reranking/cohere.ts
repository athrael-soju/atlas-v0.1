import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? '',
});

if (!process.env.COHERE_API_KEY) {
  throw new Error('COHERE_API_KEY is not set');
}

const model = process.env.COHERE_API_MODEL || 'rerank-multilingual-v3.0';

export async function rerank(
  content: string,
  queryResults: any[],
  topN: number
): Promise<{ message: string; values: string }> {
  try {
    const rerankResults = await cohere.rerank({
      model: model,
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

    const formattedResults = formatResults(rerankResults.results);

    return {
      message: 'Reranking successful',
      values: formattedResults,
    };
  } catch (error: any) {
    throw new Error('Failed to rerank documents', error.message);
  }
}

function formatResults(data: any[]): string {
  return data
    .map((item) => {
      const record = `Filename: ${item.document.filename}\nFiletype: ${item.document.filetype}\nLanguages: ${item.document.languages}\nPage Number: ${item.document.page_number}\nText: ${item.document.text}\nUser Email: ${item.document.user_email}\nRelevance Score: ${item.relevance_score}`;
      return record;
    })
    .join('\n\n');
}
