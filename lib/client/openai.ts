import OpenAI from 'openai';

const globalForOpenAI = global as unknown as { openai: OpenAI };

export const openai =
  globalForOpenAI.openai ||
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForOpenAI.openai = openai;
