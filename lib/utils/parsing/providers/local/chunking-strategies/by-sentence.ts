import { SentenceTokenizer } from 'natural';
import { franc } from 'franc';
import { randomUUID } from 'crypto';
import { ChunkedDocument, Chunk, Page } from '@/lib/types';

export async function chunkTextByMultiSentence(
  documentContents: { content: string; pages: Page[] },
  minChunkSize: number,
  maxChunkSize: number,
  fileName: string,
  fileType: string,
  parentId: string
): Promise<ChunkedDocument> {
  const tokenizer = new SentenceTokenizer();
  const sentences = tokenizer.tokenize(documentContents.content);

  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentChunkSize = 0;
  let pageIndex = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    if (currentChunkSize + sentenceLength > maxChunkSize) {
      // finalize the current chunk
      const chunkText = currentChunk.join(' ');
      const language = franc(chunkText);

      chunks.push({
        id: randomUUID(),
        text: chunkText,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          parent_id: parentId,
          pages: getCurrentPages(documentContents.pages, currentChunkSize),
          language: language,
        },
      });

      currentChunk = [sentence];
      currentChunkSize = sentenceLength;
    } else {
      currentChunk.push(sentence);
      currentChunkSize += sentenceLength;
    }

    // update pageIndex based on sentence position
    while (
      pageIndex < documentContents.pages.length &&
      currentChunkSize > documentContents.pages[pageIndex].end
    ) {
      pageIndex++;
    }
  }

  // add the last chunk if any
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    const language = franc(chunkText);

    chunks.push({
      id: randomUUID(),
      text: chunkText,
      metadata: {
        file_name: fileName,
        file_type: fileType,
        parent_id: parentId,
        pages: getCurrentPages(documentContents.pages, currentChunkSize),
        language: language,
      },
    });
  }
  const document: ChunkedDocument = {
    id: parentId,
    chunks,
  };

  return document;
}

// Helper function to get current pages
function getCurrentPages(pages: Page[], chunkSize: number): number[] {
  const currentPages: number[] = [];
  for (const page of pages) {
    if (chunkSize >= page.start && chunkSize <= page.end) {
      currentPages.push(page.pageNumber);
    }
  }
  return currentPages;
}
