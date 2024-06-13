import { rerank } from '@/lib/services/reranking/cohere';
import { embedMessage } from '@/lib/services/embedding/openai';
import { query } from '@/lib/services/indexing/pinecone';
import { performance } from 'perf_hooks';
import { ScribeParams } from '@/lib/types';
import { measurePerformance, getTotalTime } from '../../utils/metrics';

export async function retrieveContext(
  userMessage: string,
  scribeParams: ScribeParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  const totalStartTime = performance.now();
  const { userEmail, topK, topN } = scribeParams;

  try {
    const embeddingResults = await measurePerformance(
      () => embedMessage(userEmail, userMessage),
      'Embedding',
      sendUpdate
    );

    const queryResults = await measurePerformance(
      () => query(userEmail, embeddingResults, topK),
      'Querying',
      sendUpdate
    );

    const rerankingResults = await measurePerformance(
      () => rerank(userMessage, queryResults.context, topN),
      'Reranking',
      sendUpdate
    );
    return { success: true, userEmail, content: rerankingResults.values };
  } catch (error: any) {
    sendUpdate('error', error.message);
    return { success: false, userEmail, content: error.message };
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}
