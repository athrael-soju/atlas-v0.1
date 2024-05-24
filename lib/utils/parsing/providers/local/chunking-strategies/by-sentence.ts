// For text based documents only
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
  let currentPosition = 0; // Track the current position in the document

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    if (currentChunkSize + sentenceLength > maxChunkSize) {
      // Finalize the current chunk
      const chunkText = currentChunk.join(' ');
      const language = franc(chunkText);
      const currentPages = getCurrentPages(
        documentContents.pages,
        currentPosition,
        currentPosition + chunkText.length
      );

      chunks.push({
        id: randomUUID(),
        text: chunkText,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          parent_id: parentId,
          pages: currentPages,
          language: language,
        },
      });

      currentChunk = [sentence];
      currentChunkSize = sentenceLength;
      currentPosition += chunkText.length + 1; // +1 for the space
    } else {
      currentChunk.push(sentence);
      currentChunkSize += sentenceLength;
    }
  }

  // Add the last chunk if any
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    const language = franc(chunkText);
    const currentPages = getCurrentPages(
      documentContents.pages,
      currentPosition,
      currentPosition + chunkText.length
    );
    chunks.push({
      id: randomUUID(),
      text: chunkText,
      metadata: {
        file_name: fileName,
        file_type: fileType,
        parent_id: parentId,
        pages: currentPages,
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
function getCurrentPages(
  pages: Page[],
  chunkStart: number,
  chunkEnd: number
): string {
  const currentPages: number[] = [];
  for (const page of pages) {
    if (
      (chunkStart >= page.start && chunkStart <= page.end) ||
      (chunkEnd >= page.start && chunkEnd <= page.end) ||
      (chunkStart <= page.start && chunkEnd >= page.end)
    ) {
      currentPages.push(page.pageNumber);
    }
  }
  return JSON.stringify(currentPages);
}
