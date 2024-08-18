import { AiResponseParams, VoiceParams } from '@/lib/types';
import { openai } from '@/lib/client/openai';

export async function transcribe(heraldParams: VoiceParams) {
  const { message }: VoiceParams = heraldParams;
  const audioFile = new File([message], 'audio.wav', {
    type: 'audio/wav',
    lastModified: new Date().getTime(),
  });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text.trim() || null;
}

export async function synthesize(heraldParams: AiResponseParams) {
  const { message } = heraldParams;
  // Voice Synthesis will be managed by Cartesia, 11 Labs, or OpenAI.
  const voice = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'Cartesia-Version': '2024-06-30',
      'Content-Type': 'application/json',
      'X-API-Key': process.env.CARTESIA_API_KEY!,
    },
    body: JSON.stringify({
      model_id: 'sonic-english',
      transcript: message,
      voice: {
        mode: 'id',
        id: '79a125e8-cd45-4c13-8a67-188112f4dd22',
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_f32le',
        sample_rate: 24000,
      },
    }),
  });

  if (!voice.ok) {
    throw new Error('Voice synthesis request failed');
  }

  return voice.body;
}
