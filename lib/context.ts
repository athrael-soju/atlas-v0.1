import { rerank } from '@/app/services/client/cohere';
import { embedMessage } from '@/app/services/client/openai';
import { query } from '@/app/services/client/pinecone';

export async function getContext(
  userEmail: string,
  content: string,
  topK: number,
  topN: number
) {
  // Embed the user message
  const embeddingResults = await embedMessage(userEmail, content);
  console.info('Embedding: ', embeddingResults);

  // Query Pinecone for results
  const queryResults = await query(userEmail, embeddingResults, topK);
  console.info('Query: ', queryResults);

  // Rerank the results
  const rerankingResults = await rerank(content, queryResults.context, topN);
  console.info('Reranking: ', rerankingResults);
  return rerankingResults;
}
