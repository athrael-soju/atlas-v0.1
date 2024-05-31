import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userEmail, assistantId } = await req.json();
    if (userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    } else if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant id is required' },
        { status: 400 }
      );
    }

    const response = await openai.beta.assistants.del(
      `${userEmail}_${assistantId}`
    );
    return NextResponse.json({
      message: response,
      assistant: response,
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
