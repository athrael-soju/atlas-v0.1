import { headers } from 'next/headers';
import { zfd } from 'zod-form-data';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const groq = new Groq();

const schema = zfd.formData({
  input: zfd.file(),
  message: zfd.text().optional(),
});
// TODO: The herald takes as arguments an action and a heraldParams object.
// If the action is tts, the heraldParams object will contain the user's text as a string and will return the assistant's speech as a blob and the transcript as a string.
// If the action is stt, the heraldParams object will contain the user's speech as a blob and will return the transcript as a string.
// If the action is bidirectional-speech, the heraldParams object will contain the user's speech as a blob and will return the assistant's speech and the transcript as a string.
// Inference will be taken cared of by the existing assistants (Sage | Scribe) and the text will follow the standard process and storage.

// Transcribe using a cheap, reliable model
async function getTranscript(input: File) {
  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: 'whisper-large-v3',
    });
    return text.trim() || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null; // Empty audio file or transcription error
  }
}

function location() {
  const headersList = headers();
  const country = headersList.get('x-vercel-ip-country');
  const region = headersList.get('x-vercel-ip-country-region');
  const city = headersList.get('x-vercel-ip-city');
  if (!country || !region || !city) return 'unknown';
  return `${city}, ${region}, ${country}`;
}

function time() {
  return new Date().toLocaleString('en-US', {
    timeZone: headers().get('x-vercel-ip-timezone') || undefined,
  });
}

export async function POST(request: Request) {
  console.time('transcribe ' + (request.headers.get('x-vercel-id') || 'local'));

  const formData = await request.formData();
  const { success, data } = schema.safeParse(formData);

  if (!success) {
    console.error('Schema validation failed:', data);
    return new Response('Invalid request', { status: 400 });
  }

  const transcript = await getTranscript(data.input);
  if (!transcript) {
    console.error('Invalid audio input');
    return new Response('Invalid audio', { status: 400 });
  }

  console.timeEnd(
    'transcribe ' + (request.headers.get('x-vercel-id') || 'local')
  );
  console.time(
    'text completion ' + (request.headers.get('x-vercel-id') || 'local')
  );

  // Completion will be managed by the existing assistants (Sage | Scribe)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `- You are Swift, a friendly and helpful voice assistant.
        - Respond briefly to the user's request, and do not provide unnecessary information.
        - If you don't understand the user's request, ask for clarification.
        - You do not have access to up-to-date information, so you should not provide real-time data.
        - You are not capable of performing actions other than responding to the user.
        - Do not use markdown, emojis, or other formatting in your responses. Respond in a way easily spoken by text-to-speech software.
        - User location is ${location()}.
        - The current time is ${time()}.
        - Your large language model is Llama 3, created by Meta, the 8 billion parameter version. It is hosted on Groq, an AI infrastructure company that builds fast inference technology.
        - Your text-to-speech model is Sonic, created and hosted by Cartesia, a company that builds fast and realistic speech synthesis technology.
        - You are built with Next.js and hosted on Vercel.`,
      },
      ...(data.message ? JSON.parse(data.message) : []),
      {
        role: 'user',
        content: transcript,
      },
    ],
  });
  // Streams will likely be used to improve the Speed of audio.
  const response = completion.choices[0].message.content;
  console.timeEnd(
    'text completion ' + (request.headers.get('x-vercel-id') || 'local')
  );
  // Metrics will follow the standard process.
  console.time(
    'cartesia request ' + (request.headers.get('x-vercel-id') || 'local')
  );

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
      transcript: response,
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

  console.timeEnd(
    'cartesia request ' + (request.headers.get('x-vercel-id') || 'local')
  );

  if (!voice.ok) {
    console.error('Voice synthesis request failed:', await voice.text());
    return new Response('Voice synthesis failed', { status: 500 });
  }

  console.time('stream ' + (request.headers.get('x-vercel-id') || 'local'));
  console.timeEnd('stream ' + (request.headers.get('x-vercel-id') || 'local'));

  return new Response(voice.body, {
    headers: {
      'X-Transcript': encodeURIComponent(transcript),
      'X-Response': encodeURIComponent(response ?? ''),
    },
  });
}
