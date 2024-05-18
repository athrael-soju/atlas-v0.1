// parseLocal.ts
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { FileEntry } from '@/lib/types';
import { Document } from '@/lib/types';
import { randomUUID } from 'crypto';
import { franc } from 'franc';
import { getChunkingStrategy } from './strategy-selector';

export async function parseLocal(
  file: FileEntry,
  minChunkSize: number,
  maxChunkSize: number
): Promise<any[]> {
  const fileData = await fs.readFile(file.path);
  const documentContents = await processFile(fileData, file.contentType);
  const documentId = randomUUID();

  const metadata = {
    filename: file.name,
    filetype: file.contentType,
    parent_id: file.id,
  };

  const result = await chunkDocument(
    documentId,
    documentContents.pages,
    minChunkSize,
    maxChunkSize,
    metadata
  );
  return result.document.chunks;
}

async function processFile(
  fileData: Buffer,
  fileType: string
): Promise<{
  pages: { pageNumber: number; text: string; language: string }[];
  wordCount: number;
  error?: string;
}> {
  try {
    let pages: { pageNumber: number; text: string; language: string }[] = [];
    if (fileType === 'application/pdf') {
      await pdfParse(fileData, {
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
              const language = franc(pageText);
              pages.push({
                pageNumber: page.pageNumber,
                text: pageText,
                language,
              });
              return pageText;
            });
        },
      });
    } else {
      fileData
        .toString('utf8')
        .split('\f')
        .forEach((pageText: string, index: number) => {
          const language = franc(pageText);
          pages.push({ pageNumber: index + 1, text: pageText, language });
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
  pages: { pageNumber: number; text: string; language: string }[],
  minChunkSize: number,
  maxChunkSize: number,
  metadata: any
): Promise<{ document: Document }> {
  try {
    const chunkingStrategy = getChunkingStrategy();

    const document: Document = {
      documentId,
      chunks: [],
    };

    for (let page of pages) {
      let chunks;

      // Strategies like NER, dynamic, etc.
      chunks = await (
        chunkingStrategy as (
          text: string,
          minChunkSize: number,
          maxChunkSize: number
        ) => Promise<string[]>
      )(page.text, minChunkSize, maxChunkSize);

      for (let i = 0; i < chunks.length; i++) {
        document.chunks.push({
          id: `${document.documentId}:${document.chunks.length}`,
          text: chunks[i],
          metadata: {
            ...metadata,
            page_number: page.pageNumber,
            languages: page.language,
          },
        });
      }
    }

    return { document };
  } catch (error) {
    console.error('Error in chunking and embedding document:', error);
    throw error;
  }
}
