import { AssistantParams } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.formData();
    const userEmail = data.get('userEmail') as string;
    const assistantParams = JSON.parse(
      data.get('assistantParams') as string
    ) as AssistantParams;

    if (!userEmail || !assistantParams.assistantId) {
      return NextResponse.json(
        {
          error: 'User email and assistant ID are required',
        },
        { status: 400 }
      );
    }

    const currentAssistant = await openai.beta.assistants.retrieve(
      assistantParams.assistantId
    );

    if (!currentAssistant) {
      return NextResponse.json(
        {
          error: 'Assistant not found',
        },
        { status: 404 }
      );
    }

    const updatedAssistantResponse = await openai.beta.assistants.update(
      assistantParams.assistantId,
      {
        instructions:
          assistantParams.instructions ?? currentAssistant.instructions,
        name: assistantParams.name ?? currentAssistant.name,
        tools: [{ type: 'code_interpreter' }],
        tool_resources: currentAssistant.tool_resources ?? {
          code_interpreter: {
            file_ids: assistantParams.file_ids ?? [],
          },
        },
        model: assistantParams.model ?? currentAssistant.model,
      }
    );

    return NextResponse.json({
      message: 'Assistant updated',
      assistant: updatedAssistantResponse,
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
