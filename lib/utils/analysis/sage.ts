import { openai } from '@/lib/client/openai';
import { SageParams, User } from '@/lib/types';
import clientPromise from '@/lib/client/mongodb';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { measurePerformance } from '@/lib/utils/metrics';

export async function summon(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
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

  const user = await measurePerformance(
    () => userCollection.findOne({ email: userEmail }),
    'Checking for sage',
    sendUpdate
  );

  if (user?.sageId && user?.threadId) {
    throw new Error('User already has a sage');
  }

  const sage: {
    id: string;
  } = await measurePerformance(
    () =>
      openai.beta.assistants.create({
        instructions,
        name,
        tools: [{ type: 'code_interpreter' }],
        tool_resources: { code_interpreter: { file_ids: [] } },
        model,
      }),
    'Summoning sage',
    sendUpdate
  );

  await measurePerformance(
    () =>
      userCollection.updateOne(
        { email: userEmail },
        { $set: { sageId: sage.id } }
      ),
    'Updating user with sage ID',
    sendUpdate
  );

  const thread: {
    id: string;
  } = await measurePerformance(
    () => openai.beta.threads.create(),
    'Creating thread',
    sendUpdate
  );

  await measurePerformance(
    () =>
      userCollection.updateOne(
        { email: userEmail },
        { $set: { threadId: thread.id } }
      ),
    'Updating user with thread ID',
    sendUpdate
  );
}

export async function reform(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const { userEmail, name, instructions, model, file_ids } = sageParams;

  if (!userEmail) {
    throw new Error('User email is required');
  }

  const client = await clientPromise;
  const db = client.db('Atlas');
  const userCollection = db.collection<User>('users');

  const user = await measurePerformance(
    () => userCollection.findOne({ email: userEmail }),
    'Checking for sage',
    sendUpdate
  );

  if (!user?.sageId) {
    throw new Error('User does not have a sage');
  }

  const currentSage: any = await measurePerformance(
    () => openai.beta.assistants.retrieve(user.sageId as string),
    'Retrieving current sage',
    sendUpdate
  );

  if (!currentSage) {
    throw new Error('Sage not found');
  }

  await measurePerformance(
    () =>
      openai.beta.assistants.update(currentSage.id, {
        instructions: instructions ?? currentSage.instructions,
        name: name ?? currentSage.name,
        tools: [{ type: 'code_interpreter' }],
        tool_resources: currentSage.tool_resources ?? {
          code_interpreter: { file_ids: file_ids ?? [] },
        },
        model: model ?? currentSage.model,
      }),
    'Reforming sage',
    sendUpdate
  );
}

export async function dismiss(
  sageParams: { userEmail: string },
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const { userEmail } = sageParams;

  if (!userEmail) {
    throw new Error('User email is required');
  }

  const client = await clientPromise;
  const db = client.db('Atlas');
  const userCollection = db.collection<User>('users');

  const user = await measurePerformance(
    () => userCollection.findOne({ email: userEmail }),
    'Checking for sage',
    sendUpdate
  );

  if (!user?.sageId || !user?.threadId) {
    throw new Error('User does not have a sage ID or thread ID');
  }

  await measurePerformance(
    () =>
      userCollection.updateOne(
        { email: userEmail },
        { $unset: { sageId: '', threadId: '' } }
      ),
    'Updating user to remove sage and thread IDs',
    sendUpdate
  );

  await measurePerformance(
    () => openai.beta.assistants.del(user.sageId as string),
    'Dismissing sage',
    sendUpdate
  );
}

export async function consult(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const { userEmail, message, file_ids } = sageParams;

  if (!userEmail || !message) {
    throw new Error('User email and message are required');
  }

  const client = await clientPromise;
  const db = client.db('Atlas');
  const userCollection = db.collection<User>('users');

  const user = await measurePerformance(
    () => userCollection.findOne({ email: userEmail }),
    'Checking for sage',
    sendUpdate
  );

  if (!user?.sageId || !user?.threadId) {
    throw new Error('User does not have a sage or thread ID');
  }

  const myThread: {
    id: string;
  } = await measurePerformance(
    () => openai.beta.threads.retrieve(user.threadId as string),
    'Retrieving thread',
    sendUpdate
  );

  if ((file_ids?.length ?? 0) > 0) {
    await measurePerformance(
      () =>
        openai.beta.threads.update(myThread.id, {
          metadata: { modified: 'true', user: user.email },
          tool_resources: { code_interpreter: { file_ids } },
        }),
      'Updating thread',
      sendUpdate
    );
  }

  await measurePerformance(
    () =>
      openai.beta.threads.messages.create(myThread.id, {
        role: 'user',
        content: message,
      }),
    'Creating message',
    sendUpdate
  );

  const stream: any = AssistantStream.fromReadableStream(
    openai.beta.threads.runs
      .stream(myThread.id, {
        assistant_id: user.sageId,
      })
      .toReadableStream()
  );

  await measurePerformance(
    () =>
      new Promise((resolve, reject) => {
        stream
          .on('textCreated', () => {
            sendUpdate('text_created', 'text_created');
          })
          .on('textDelta', (textDelta: { value: string }) => {
            if (textDelta.value) {
              sendUpdate('text', textDelta.value);
            }
          })
          .on('toolCallCreated', () => {
            sendUpdate('code_created', 'text_created');
          })
          .on(
            'toolCallDelta',
            (toolCallDelta: {
              type: string;
              code_interpreter: { input: string; outputs: any[] };
            }) => {
              if (toolCallDelta.type === 'code_interpreter') {
                if (toolCallDelta.code_interpreter?.input) {
                  sendUpdate('code', toolCallDelta.code_interpreter.input);
                }
                if (toolCallDelta.code_interpreter?.outputs) {
                  toolCallDelta.code_interpreter.outputs.forEach((output) => {
                    if (output.type === 'logs') {
                      sendUpdate('log', output.logs as string);
                    }
                  });
                }
              }
            }
          )
          .on('imageFileDone', (image: { file_id: any }) => {
            const imageUrl = `\n![${image.file_id}](/api/files/${image.file_id})\n`;
            sendUpdate('image', imageUrl);
          })
          .on('event', (event: any) => {
            if (event.event === 'thread.run.requires_action') {
              sendUpdate('notification', 'requires_action');
            }
            if (event.event === 'thread.run.completed') {
              sendUpdate('notification', 'events_completed');
              resolve(event);
            }
          })
          .on('error', (error: any) => {
            reject(new Error(error.message));
          });
      }),
    'Consulting sage',
    sendUpdate
  );
}
