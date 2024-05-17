import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { FileEntry } from '@/lib/types';
import { Document } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function parseLocal(
  file: FileEntry,
  minChunkSize: number,
  maxChunkSize: number,
  overlap: number
): Promise<any[]> {
  const fileData = await fs.readFile(file.path);
  const documentContents = await processFile(
    file.name,
    fileData,
    file.contentType
  );
  const documentId = randomUUID();

  const metadata = {
    filename: file.name,
    filetype: file.contentType,
    languages: 'n/a',
    page_number: 'n/a',
    parent_id: file.id,
  };

  const result = await chunkDocument(
    documentId,
    documentContents.pages,
    minChunkSize,
    maxChunkSize,
    overlap,
    metadata
  );
  return result.document.chunks;
}

async function processFile(
  fileName: string,
  fileData: Buffer,
  fileType: string
): Promise<{
  pages: { pageNumber: number; text: string }[];
  wordCount: number;
  error?: string;
}> {
  try {
    let pages: { pageNumber: number; text: string }[] = [];
    if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(fileData, {
        pagerender: function (page: any) {
          return page
            .getTextContent({
              normalizeWhitespace: true,
            })
            .then(function (textContent: { items: any[] }) {
              const pageText = textContent.items
                .map(function (item) {
                  return item.str;
                })
                .join(' ');
              pages.push({ pageNumber: page.pageNumber, text: pageText });
              return pageText;
            });
        },
      });
    } else {
      fileData
        .toString('utf8')
        .split('\f')
        .forEach((pageText: string, index: number) => {
          pages.push({ pageNumber: index + 1, text: pageText });
        });
    }

    const wordCount = pages.reduce(
      (acc, page) => acc + page.text.split(/\s+/).length,
      0
    );

    return { pages, wordCount };
  } catch (error: any) {
    console.error(
      'An error occurred while processing the document:',
      error.message
    );
    throw error;
  }
}

async function chunkDocument(
  documentId: string,
  pages: { pageNumber: number; text: string }[],
  minChunkSize: number,
  maxChunkSize: number,
  overlap: number, // Not yet supported
  metadata: any
): Promise<{ document: Document }> {
  try {
    const document: Document = {
      documentId,
      chunks: [],
    };

    for (let page of pages) {
      const chunks = chunkTextByMultiParagraphs(
        page.text,
        minChunkSize,
        maxChunkSize
      );
      for (let i = 0; i < chunks.length; i++) {
        document.chunks.push({
          id: `${document.documentId}:${document.chunks.length}`,
          text: chunks[i],
          metadata: { ...metadata, page_number: page.pageNumber },
        });
      }
    }

    return { document };
  } catch (error) {
    console.error('Error in chunking and embedding document:', error);
    throw error;
  }
}

function chunkTextByMultiParagraphs(
  text: string,
  minChunkSize: number,
  maxChunkSize: number
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      const paragraphBoundary = text.indexOf('\n\n', endIndex);
      if (paragraphBoundary !== -1) {
        endIndex = paragraphBoundary;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length >= minChunkSize) {
      chunks.push(chunk);
      currentChunk = '';
    } else {
      currentChunk += chunk + '\n\n';
    }

    startIndex = endIndex + 1;
  }

  if (currentChunk.length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
    chunks[chunks.length - 1] += '\n\n' + currentChunk.trim();
  } else {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
