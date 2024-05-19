// parseLocal.ts
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { Chunk, FileEntry, Page } from '@/lib/types';
import { getChunkingStrategy } from './strategy-selector';

export async function parseLocal(
  file: FileEntry,
  minChunkSize: number,
  maxChunkSize: number
): Promise<Chunk[]> {
  const fileData = await fs.readFile(file.path);
  const documentContents = await processFile(fileData, file.contentType);
  const fileName = file.name;
  const fileType = file.contentType;
  const parentId = file.id;

  const chunkingStrategy = getChunkingStrategy();
  const chunkedDocument = await chunkingStrategy(
    documentContents,
    minChunkSize,
    maxChunkSize,
    fileName,
    fileType,
    parentId
  );

  return chunkedDocument.chunks;
}

// Function to process the file and extract text with page numbers
async function processFile(
  fileData: Buffer,
  contentType: string
): Promise<{
  content: string;
  pages: Page[];
}> {
  try {
    let content = '';
    const pages: Page[] = [];
    let startIndex = 0;
    let pageIndex = 0;
    if (contentType === 'application/pdf') {
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
              const endIndex = startIndex + pageText.length;
              pages.push({
                start: startIndex,
                end: endIndex,
                pageNumber: ++pageIndex,
              });
              content += pageText + '\n';
              startIndex = endIndex + 1; // +1 for the newline character added

              return pageText;
            });
        },
      });
      content = pdfData.text;
    } else {
      content = fileData.toString('utf8');
    }

    //const wordCount = content.split(/\s+/).length;

    return { content, pages };
  } catch (error: any) {
    console.error(
      'An error occurred while processing the document:',
      error.message
    );
    throw error;
  }
}
