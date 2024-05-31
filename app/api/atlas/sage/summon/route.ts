import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestBody = await req.json();
    const { userEmail, name, instructions } = requestBody;

    if (!userEmail || !name || !instructions) {
      return NextResponse.json(
        {
          error: 'User email, name and description are required',
        },
        { status: 400 }
      );
    }

    const myAssistant = await openai.beta.assistants.create({
      instructions: instructions,
      name: name,
      tools: [{ type: 'code_interpreter' }],
      model: process.env.OPENAI_MODEL_ID as string,
    });

    return NextResponse.json({
      message: 'Assistant created',
      assistant: myAssistant,
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
