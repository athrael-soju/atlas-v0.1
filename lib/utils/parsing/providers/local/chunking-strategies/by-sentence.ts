import natural from 'natural';

export async function chunkTextByMultiSentence(
  text: string,
  minChunkSize: number,
  maxChunkSize: number
): Promise<string[]> {
  const tokenizer = new natural.SentenceTokenizer();
  const sentences = tokenizer.tokenize(text);

  const chunks: string[] = [];
  let currentChunk = '';
  let currentChunkSize = 0;

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

  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
    chunks[chunks.length - 1] += ' ' + currentChunk.trim();
  } else {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
