export async function chunkTextByMultiParagraphs(
  text: string,
  minChunkSize: number,
  maxChunkSize: number
): Promise<string[]> {
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
