import natural from 'natural';

export function chunkTextByMultiParagraphs(
  text: string,
  minChunkSize: number,
  maxChunkSize: number
): string[] {
  const tokenizer = new natural.SentenceTokenizer();
  const paragraphs = text.split('\n\n');

  const chunks: string[] = [];
  let currentChunk = '';
  let currentChunkSize = 0;

  for (const paragraph of paragraphs) {
    const sentences = tokenizer.tokenize(paragraph);

    for (const sentence of sentences) {
      if (currentChunkSize + sentence.length > maxChunkSize) {
        if (currentChunkSize >= minChunkSize) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
          currentChunkSize = sentence.length;
        } else {
          currentChunk += ' ' + sentence;
          currentChunkSize += sentence.length;
        }
      } else {
        currentChunk += ' ' + sentence;
        currentChunkSize += sentence.length;
      }
    }

    // Add a paragraph break between chunks if paragraph ends
    if (currentChunkSize + 2 <= maxChunkSize) {
      currentChunk += '\n\n';
      currentChunkSize += 2;
    }
  }

  // Handle remaining text in current chunk
  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
    chunks[chunks.length - 1] += ' ' + currentChunk.trim();
  } else {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
