import { AiResponseParams, VoiceParams } from '@/lib/types';
import { measurePerformance } from '@/lib/utils/metrics';
import { synthesize, transcribe } from '../speech/cartesia';

export async function getTranscript(
  voiceParams: VoiceParams,
  sendUpdate: (type: string, message: string) => void
) {
  const transcript = await measurePerformance(
    () => transcribe(voiceParams),
    'Transcribing audio to text',
    sendUpdate
  );
  sendUpdate('transcript', `${transcript}`);
}

export async function getSynthesis(
  transcriptParams: AiResponseParams,
  sendUpdate: (type: string, message: string) => void
) {
  const synthesisStream = await measurePerformance(
    () => synthesize(transcriptParams),
    'Synthesizing audio from text',
    sendUpdate
  );

  if (synthesisStream) {
    const reader = synthesisStream.getReader();
    const chunks = [];

    // Read the stream in chunks and accumulate them
    let done, value;
    do {
      ({ done, value } = await reader.read());
      if (value) {
        chunks.push(value);
      }
    } while (!done);

    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const fullArray = new Uint8Array(totalLength);

    let position = 0;
    for (const chunk of chunks) {
      fullArray.set(chunk, position);
      position += chunk.length;
    }

    // Convert the full Uint8Array to Base64 and send
    const base64Data = Buffer.from(fullArray).toString('base64');
    sendUpdate('synthesis-complete', base64Data);
  } else {
    sendUpdate('error', 'Failed to initiate synthesis stream');
  }
}
