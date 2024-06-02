import { openai } from '@/lib/client/openai';
import { prisma } from '@/lib/client/prisma';

export async function summon(
  data: any,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, name, instructions, model } = data;

  if (!userEmail || !name || !instructions || !model) {
    throw new Error(
      'User email, sage name, instructions, and model are required'
    );
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });

  if (user?.sageId && user?.threadId) {
    throw new Error('User already has an assistant');
  }

  sendUpdate('Summoning assistant...');
  const mySage = await openai.beta.assistants.create({
    instructions,
    name,
    tools: [{ type: 'code_interpreter' }],
    tool_resources: { code_interpreter: { file_ids: [] } },
    model,
  });
  sendUpdate('Sage summoned successfully.');

  await prisma.user.update({
    where: { email: userEmail },
    data: { sageId: mySage.id },
  });
  sendUpdate('User updated with assistant ID.');

  sendUpdate('Creating thread...');
  const thread = await openai.beta.threads.create();
  sendUpdate('Thread created successfully.');

  await prisma.user.update({
    where: { email: userEmail },
    data: { threadId: thread.id },
  });
  sendUpdate('User updated with thread ID.');

  return {
    assistant: mySage,
    threadId: thread.id,
  };
}

export async function reform(
  data: any,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, assistantParams } = data;

  if (!userEmail || !assistantParams.sageId) {
    throw new Error('User email and assistant ID are required');
  }

  const currentSage = await openai.beta.assistants.retrieve(
    assistantParams.sageId
  );

  if (!currentSage) {
    throw new Error('Sage not found');
  }

  sendUpdate('Reforming assistant...');
  const updatedSageResponse = await openai.beta.assistants.update(
    assistantParams.sageId,
    {
      instructions: assistantParams.instructions ?? currentSage.instructions,
      name: assistantParams.name ?? currentSage.name,
      tools: [{ type: 'code_interpreter' }],
      tool_resources: currentSage.tool_resources ?? {
        code_interpreter: { file_ids: assistantParams.file_ids ?? [] },
      },
      model: assistantParams.model ?? currentSage.model,
    }
  );
  sendUpdate('Sage reformed successfully.');

  return updatedSageResponse;
}

export async function dismiss(
  data: any,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, sageId } = data;

  if (!userEmail || !sageId) {
    throw new Error('User email and assistant id are required');
  }

  sendUpdate('Dismissing assistant...');
  const response = await openai.beta.assistants.del(`${userEmail}_${sageId}`);
  sendUpdate('Sage dismissed successfully.');

  return response;
}
