import { rerank } from '@/lib/utils/reranking/cohere';
import { embedMessage } from '@/lib/utils/embedding/openai';
import { query } from '@/lib/utils/indexing/pinecone';
import { performance } from 'perf_hooks';
import { ArchiveParams } from '@/lib/types';

export async function retrieveContext(
  content: string,
  archiveParams: ArchiveParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  const totalStartTime = performance.now();
  const userEmail = archiveParams.userEmail;
  const topK = archiveParams.topK;
  const topN = archiveParams.topN;
  try {
    let startTime, endTime;

    startTime = performance.now();
    sendUpdate('notification','Embedding...');
    const embeddingResults = await embedMessage(userEmail, content);
    endTime = performance.now();
    sendUpdate('notification',
      `Embedding completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification','Querying...');
    const queryResults = await query(userEmail, embeddingResults, topK);
    endTime = performance.now();
    sendUpdate('notification',
      `Querying completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    startTime = performance.now();
    sendUpdate('notification','Reranking...');
    const rerankingResults = queryResults.context
      ? await rerank(content, queryResults.context, topN)
      : [];
    endTime = performance.now();
    sendUpdate('notification',
      `Reranking completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    );

    const totalEndTime = performance.now(); // End timing the total process
    sendUpdate('notification',
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );

    sendUpdate('notification','Query Success!');
    return { success: true, userEmail, content: rerankingResults.values };
  } catch (error: any) {
    const totalEndTime = performance.now(); // End timing even if there is an error
    sendUpdate('notification',`Error retrieving context for ${content}: ${error.message}`);
    sendUpdate('notification',
      `Total process completed in ${((totalEndTime - totalStartTime) / 1000).toFixed(2)} seconds`
    );
    return { success: false, userEmail, content: error.message };
  }
}
