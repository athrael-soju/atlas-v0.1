import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose, SageParams } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { RequiredActionFunctionToolCall } from 'openai/resources/beta/threads/runs/runs';

export async function summon(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail, name, instructions, model } = sageParams;

    if (!userEmail || !name || !instructions || !model) {
      throw new Error(
        'User email, sage name, instructions, and model are required'
      );
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      'Checking for sage',
      sendUpdate
    );

    if (user?.sageId && user?.threadId) {
      throw new Error('User already has summoned a sage');
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
      () => dbInstance.summonSage(userEmail, sage.id),
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
      () => dbInstance.addThreadId(userEmail, thread.id),
      'Updating user with thread ID',
      sendUpdate
    );
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function reform(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();

  try {
    const { userEmail, name, instructions, model, file_ids } = sageParams;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      'Checking for sage',
      sendUpdate
    );

    if (!user.sageId) {
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
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function dismiss(
  sageParams: { userEmail: string },
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail } = sageParams;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      'Checking for sage',
      sendUpdate
    );

    if (!user.sageId || !user.threadId) {
      throw new Error('User does not have a sage ID or thread ID');
    }

    await measurePerformance(
      () => dbInstance.dismissSage(userEmail),
      'Updating user to remove sage and thread IDs',
      sendUpdate
    );

    await measurePerformance(
      () => openai.beta.assistants.del(user.sageId as string),
      'Dismissing sage',
      sendUpdate
    );
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

export async function consult(
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { userEmail, message } = sageParams;

    if (!userEmail || !message) {
      throw new Error('User email and message are required');
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      'Checking for sage',
      sendUpdate
    );

    if (!user.sageId || !user.threadId) {
      throw new Error('User does not have a sage or thread ID');
    }

    const myThread: {
      id: string;
    } = await measurePerformance(
      () => openai.beta.threads.retrieve(user.threadId as string),
      'Retrieving thread',
      sendUpdate
    );

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
      () => handleReadableStream(stream, sendUpdate, userEmail, dbInstance),
      'Consulting sage',
      sendUpdate
    );
  } catch (error: any) {
    sendUpdate('error', error.message);
  } finally {
    const totalEndTime = performance.now();
    getTotalTime(totalStartTime, totalEndTime, sendUpdate);
  }
}

const handleReadableStream = async (
  stream: AssistantStream,
  sendUpdate: (type: string, message: string) => void,
  userEmail: string,
  dbInstance: {
    addFile: (userEmail: string, atlasFile: AtlasFile) => Promise<any>;
  }
) =>
  new Promise((resolve, reject) => {
    stream.on('textCreated', () => {
      sendUpdate('text_created', 'text_created');
    });
    stream.on('textDelta', (textDelta) => {
      if (textDelta.value) {
        sendUpdate('text', textDelta.value);
      }
    });
    stream.on('toolCallCreated', () => {
      sendUpdate('code_created', 'code_created');
    });
    stream.on('toolCallDelta', (toolCallDelta) => {
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
    });
    stream.on('imageFileDone', async (image: { file_id: string }) => {
      const imageUrl = `\n![${image.file_id}](/api/atlas/archivist/${image.file_id})\n`;
      sendUpdate('image', imageUrl);
      if (imageUrl) {
        const atlasFile: AtlasFile = {
          id: image.file_id,
          name: `Image: ${Date.now()}`,
          content: {},
          path: imageUrl,
          userEmail,
          uploadDate: Date.now(),
          purpose: Purpose.Sage,
        };

        const addFile = await dbInstance.addFile(userEmail, atlasFile);
        if (!addFile) {
          throw new Error('Error adding image to database');
        }
        sendUpdate('notification', 'image_added to database');
      } else {
        sendUpdate('error', 'Failed to generate image');
      }
    });
    stream.on('event', (event: AssistantStreamEvent) => {
      if (process.env.SAGE_EVENT_DEBUG === 'true') {
        console.info('Event:', event);
      }
      if (event.event === 'thread.run.requires_action') {
        sendUpdate('notification', 'requires_action');
        //handleRequiresAction(event);
      }
      if (event.event === 'thread.run.completed') {
        sendUpdate('notification', 'events_completed');
        // TODO - setInputDisabled(false);
        resolve(event);
      }
    });
    stream.on('error', (error: any) => {
      reject(error);
    });
  });

// handleRequiresAction - handle function call
const handleRequiresAction = async (
  event: AssistantStreamEvent.ThreadRunRequiresAction
) => {
  const runId = event.data.id;
  const toolCalls =
    event.data.required_action?.submit_tool_outputs.tool_calls ?? [];
  // loop over tool calls and call function handler
  const toolCallOutputs = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const result = await functionCallHandler(toolCall);
      return { output: result, tool_call_id: toolCall.id };
    })
  );
  // Disable user input
  // setInputDisabled(true);
  submitActionResult(runId, toolCallOutputs);
};

const submitActionResult = async (
  runId: string,
  toolCallOutputs: { output: any; tool_call_id: string }[]
) => {
  const response = await fetch(`/api/atlas/sage/threads/${threadId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      runId: runId,
      toolCallOutputs: toolCallOutputs,
    }),
  });
  const stream = AssistantStream.fromReadableStream(response.body);
  handleReadableStream(stream);
};

const functionCallHandler = async (call: RequiredActionFunctionToolCall) => {
  if (call?.function?.name === 'get_weather') {
    // const args = JSON.parse(call.function.arguments);
    // const data = getWeather(args.location);
    // setWeatherData(data);
    // return JSON.stringify(data);
  }
  return;
};
