import { CohereClient } from 'cohere-ai';
import { RerankResponseResultsItem } from 'cohere-ai/api/types';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? '',
});

if (!process.env.COHERE_API_KEY) {
  throw new Error('COHERE_API_KEY is not set');
}

const model = process.env.COHERE_API_MODEL || 'rerank-multilingual-v3.0';

export async function rerank(
  userMessage: string,
  queryResults: any[],
  topN: number
): Promise<{ message: string; values: RerankResponseResultsItem[] }> {
  try {
    if (queryResults.length < 1) {
      return {
        message: 'Query results are empty. Reranking skipped',
        values: [],
      };
    }
    const rerank = await cohere.rerank({
      model: model,
      documents: queryResults,
      rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
      query: userMessage,
      topN: topN,
      returnDocuments: true,
    });

    return {
      message: 'Reranking successful',
      values: rerank.results,
    };
  } catch (error: any) {
    throw new Error('Failed to rerank documents', error.message);
  }
}
