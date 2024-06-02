import { rerank } from '@/lib/utils/reranking/cohere';
import { embedMessage } from '@/lib/utils/embedding/openai';
import { query } from '@/lib/utils/indexing/pinecone';
import { performance } from 'perf_hooks';
import { ArchiveParams } from '@/lib/types';

export async function retrieveContext(
  content: string,
  archiveParams: ArchiveParams,
  sendUpdate: (message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  const totalStartTime = performance.now(); // Start timing the total process
  const userEmail = archiveParams.userEmail;
  const topK = archiveParams.topK;
  const topN = archiveParams.topN;
  try {
    let startTime, endTime;

    startTime = performance.now();
    sendUpdate('Embedding...');
    const embeddingResults = await embedMessage(userEmail, content);
    endTime = performance.now();
    sendUpdate(
      `Embedding completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('Querying...');
    const queryResults = await query(userEmail, embeddingResults, topK);
    endTime = performance.now();
    sendUpdate(
      `Querying completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('Reranking...');
    const rerankingResults = queryResults.context
      ? await rerank(content, queryResults.context, topN)
      : [];
    endTime = performance.now();
    sendUpdate(
      `Reranking completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    const totalEndTime = performance.now(); // End timing the total process
    sendUpdate(
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    sendUpdate('Query Success!');
    return { success: true, userEmail, content: rerankingResults.values };
  } catch (error: any) {
    const totalEndTime = performance.now(); // End timing even if there is an error
    sendUpdate(`Error retrieving context for ${content}: ${error.message}`);
    sendUpdate(
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return { success: false, userEmail, content: error.message };
  }
}
