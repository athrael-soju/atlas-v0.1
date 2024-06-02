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
    throw new Error('User already has a sage');
  }

  sendUpdate('Summoning sage...');
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
  sendUpdate('User updated with sage ID.');

  sendUpdate('Creating thread...');
  const thread = await openai.beta.threads.create();
  sendUpdate('Thread created successfully.');

  await prisma.user.update({
    where: { email: userEmail },
    data: { threadId: thread.id },
  });
  sendUpdate('User updated with thread ID.');

  return {
    sage: mySage,
    threadId: thread.id,
  };
}

export async function reform(
  data: any,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, sageParams } = data;

  if (!userEmail || !sageParams.sageId) {
    throw new Error('User email and sage ID are required');
  }

  const currentSage = await openai.beta.assistants.retrieve(sageParams.sageId);

  if (!currentSage) {
    throw new Error('Sage not found');
  }

  sendUpdate('Reforming sage...');
  const updatedSageResponse = await openai.beta.assistants.update(
    sageParams.sageId,
    {
      instructions: sageParams.instructions ?? currentSage.instructions,
      name: sageParams.name ?? currentSage.name,
      tools: [{ type: 'code_interpreter' }],
      tool_resources: currentSage.tool_resources ?? {
        code_interpreter: { file_ids: sageParams.file_ids ?? [] },
      },
      model: sageParams.model ?? currentSage.model,
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
    throw new Error('User email and sage id are required');
  }

  sendUpdate('Dismissing sage...');
  const response = await openai.beta.assistants.del(`${userEmail}_${sageId}`);
  sendUpdate('Sage dismissed successfully.');

  return response;
}
