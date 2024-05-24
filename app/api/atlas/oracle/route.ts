import { NextRequest, NextResponse } from 'next/server';
import { rerank } from '@/lib/utils/reranking/cohere';
import { embedMessage } from '@/lib/utils/embedding/openai';
import { query } from '@/lib/utils/indexing/pinecone';
import { performance } from 'perf_hooks';
import { OracleParams } from '@/lib/types';

export const runtime = 'nodejs';

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(`data: ${message}\n\n`);
}

async function retrieveContext(
  content: string,
  oracleParams: OracleParams,
  sendUpdate: (message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  const totalStartTime = performance.now(); // Start timing the total process
  const userEmail = oracleParams.userEmail;
  const topK = oracleParams.topK;
  const topN = oracleParams.topN;
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

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const content = data.get('content') as string;
    const oracleParams = JSON.parse(
      data.get('oracleParams') as string
    ) as OracleParams;

    if (!oracleParams.userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content in user message' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (message: string) => sendUpdate(controller, message);

        const response = await retrieveContext(content, oracleParams, send);

        send(`Final Result: ${JSON.stringify(response.content)}`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
