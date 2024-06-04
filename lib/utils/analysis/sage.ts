import { openai } from '@/lib/client/openai';
import { SageParams, User } from '@/lib/types';
import clientPromise from '@/lib/client/mongodb';

export async function summon(
  sageParams: SageParams,
  sendUpdate: (message: string) => void
): Promise<any> {
  const client = await clientPromise;
  const db = client.db('Atlas');

  const userCollection = db.collection<User>('users');

  const { userEmail, name, instructions, model } = sageParams;

  if (!userEmail || !name || !instructions || !model) {
    throw new Error(
      'User email, sage name, instructions, and model are required'
    );
  }

  const user = await userCollection.findOne({ email: userEmail });

  if (user?.sageId && user?.threadId) {
    throw new Error('User already has a sage');
  } else {
    sendUpdate('Summoning sage...');
    const sage = await openai.beta.assistants.create({
      instructions,
      name,
      tools: [{ type: 'code_interpreter' }],
      tool_resources: { code_interpreter: { file_ids: [] } },
      model,
    });
    sendUpdate('Sage summoned successfully.');
    await userCollection.updateOne(
      { email: userEmail },
      {
        $set: {
          sageId: sage.id,
        },
      }
    );

    sendUpdate('User updated with sage ID.');

    sendUpdate('Creating thread...');
    const thread = await openai.beta.threads.create();
    sendUpdate('Thread created successfully.');

    await userCollection.updateOne(
      { email: userEmail },
      {
        $set: {
          threadId: thread.id,
        },
      }
    );

    sendUpdate('User updated with thread ID.');
    return {
      sage: sage,
      threadId: thread.id,
    };
  }
}

export async function reform(
  sageParams: SageParams,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, name, instructions, model, file_ids } = sageParams;
  const client = await clientPromise;
  const db = client.db('Atlas');
  if (!userEmail) {
    throw new Error('User email is required');
  }

  const user = await db.collection('users').findOne({ email: userEmail });

  if (!user?.sageId) {
    throw new Error('User does not have a sage');
  }

  const currentSage = await openai.beta.assistants.retrieve(user.sageId);

  if (!currentSage) {
    throw new Error('Sage not found');
  }

  sendUpdate('Reforming sage...');
  const updatedSageResponse = await openai.beta.assistants.update(
    currentSage.id,
    {
      instructions: instructions ?? currentSage.instructions,
      name: name ?? currentSage.name,
      tools: [{ type: 'code_interpreter' }],
      tool_resources: currentSage.tool_resources ?? {
        code_interpreter: { file_ids: file_ids ?? [] },
      },
      model: model ?? currentSage.model,
    }
  );
  sendUpdate('Sage reformed successfully.');

  return updatedSageResponse;
}

export async function consult(
  sageParams: SageParams,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, message, file_ids } = sageParams;
  const client = await clientPromise;
  const db = client.db('Atlas');
  if (!userEmail || !message) {
    throw new Error('User email and message are required');
  }

  const user = await db.collection('users').findOne({ email: userEmail });

  if (!user?.sageId || !user?.threadId) {
    throw new Error('User does not have a sage or thread ID');
  }
  sendUpdate('User found with sage and thread ID.');

  const myThread = await openai.beta.threads.retrieve(user.threadId);
  sendUpdate('Thread retrieved successfully.');

  if ((file_ids?.length ?? 0) > 0) {
    sendUpdate('Updating thread...');
    await openai.beta.threads.update(myThread.id, {
      metadata: { modified: 'true', user: user.email },
      tool_resources: { code_interpreter: { file_ids: file_ids } },
    });
    sendUpdate('Thread updated successfully.');
  }

  sendUpdate('Creating message...');
  await openai.beta.threads.messages.create(myThread.id, {
    role: 'user',
    content: message,
  });
  sendUpdate('Message created successfully.');

  sendUpdate('Consulting sage...');
  const stream = openai.beta.threads.runs.stream(myThread.id, {
    assistant_id: user.sageId,
  });

  return stream.toReadableStream();
}

export async function dismiss(
  sageParams: any,
  sendUpdate: (message: string) => void
): Promise<any> {
  const { userEmail, sageId } = sageParams;

  if (!userEmail || !sageId) {
    throw new Error('User email and sage id are required');
  }

  sendUpdate('Dismissing sage...');
  const response = await openai.beta.assistants.del(`${sageId}`);
  sendUpdate('Sage dismissed successfully.');

  return response;
}
