import { chunkTextByMultiParagraphs } from './chunking-strategies/by-paragraph';
import { chunkTextByMultiSentence } from './chunking-strategies/by-sentence';
import { chunkTextBySentencesWithNER } from './chunking-strategies/by-sentence-ner';
//import { chunkTextSemantically } from './chunking-strategies/semantic';
// import { chunkTextByTopicModeling } from './chunking-strategies/topic-modeling';
// import { chunkTextBySlidingWindow } from './chunking-strategies/sliding-window';
//import { chunkTextByCustomDelimiter } from './chunking-strategies/custom-delimiter';

const CHUNKING_STRATEGY = process.env.CHUNKING_STRATEGY || 'dynamic';

export function getChunkingStrategy() {
  switch (CHUNKING_STRATEGY) {
    case 'byParagraph':
      return chunkTextByMultiParagraphs;
    case 'bySentence':
      return chunkTextByMultiSentence;
    // case 'semantic':
    //   return chunkTextSemantically;
    case 'ner':
      return chunkTextBySentencesWithNER;
    // case 'topicModeling':
    //   return chunkTextByTopicModeling;
    // case 'slidingWindow':
    //   return chunkTextBySlidingWindow;
    // case 'customDelimiter':
    //   return chunkTextByCustomDelimiter;
    default:
      throw new Error(`Unknown chunking strategy: ${CHUNKING_STRATEGY}`);
  }
}
