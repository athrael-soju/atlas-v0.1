import { rerank } from '@/lib/utils/reranking/cohere';
import { embedMessage } from '@/lib/utils/embedding/openai';
import { query } from '@/lib/utils/indexing/pinecone';
import { performance } from 'perf_hooks';
import { ArchiveParams } from '@/lib/types';
import { measurePerformance } from '../metrics';

export async function retrieveContext(
  content: string,
  archiveParams: ArchiveParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  const totalStartTime = performance.now();
  const { userEmail, topK, topN } = archiveParams;

  try {
    const embeddingResults = await measurePerformance(
      () => embedMessage(userEmail, content),
      'Embedding',
      sendUpdate
    );

    const queryResults = await measurePerformance(
      () => query(userEmail, embeddingResults, topK),
      'Querying',
      sendUpdate
    );

    const rerankingResults = await measurePerformance(
      () => rerank(content, queryResults.context, topN),
      'Reranking',
      sendUpdate
    );

    const totalEndTime = performance.now();
    sendUpdate(
      'notification',
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    sendUpdate('notification', 'Query Success!');
    return { success: true, userEmail, content: rerankingResults.values };
  } catch (error: any) {
    const totalEndTime = performance.now();
    sendUpdate('error', error.message);
    sendUpdate(
      'error',
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return { success: false, userEmail, content: error.message };
  }
}
