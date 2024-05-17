import { NextRequest, NextResponse } from 'next/server';
import { rerank } from '@/lib/utils/reranking/cohere';
import { embedMessage } from '@/lib/utils/embedding/openai';
import { query } from '@/lib/utils/indexing/pinecone';

export const runtime = 'nodejs';

function sendUpdate(
  controller: ReadableStreamDefaultController,
  message: string
): void {
  controller.enqueue(`data: ${message}\n\n`);
}

async function retrieve(
  userEmail: string,
  content: string,
  topK: number,
  topN: number,
  sendUpdate: (message: string) => void
): Promise<{ success: boolean; userEmail: string; content: any }> {
  try {
    sendUpdate('Embedding...');
    const embeddingResults = await embedMessage(userEmail, content);

    sendUpdate('Querying...');
    const queryResults = await query(userEmail, embeddingResults, topK);

    sendUpdate('Reranking...');
    const rerankingResults = queryResults.context
      ? await rerank(content, queryResults.context, topN)
      : [];

    sendUpdate('Query Success!');
    return { success: true, userEmail, content: rerankingResults.values };
  } catch (error: any) {
    sendUpdate(`Error retrieving context for ${content}: ${error.message}`);
    return { success: false, userEmail, content: error.message };
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = await req.formData();
    const userEmail = data.get('userEmail') as string;
    const content = data.get('content') as string;
    const topK = Number(data.get('topK'));
    const topN = Number(data.get('topN'));

    if (!userEmail) {
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

        const response = await retrieve(userEmail, content, topK, topN, send);

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
