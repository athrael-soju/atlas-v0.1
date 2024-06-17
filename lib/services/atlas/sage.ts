import { openai } from '@/lib/client/openai';
import { AtlasFile, Purpose, SageParams } from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { getTotalTime, measurePerformance } from '@/lib/utils/metrics';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';

export async function consult(
  userEmail: string,
  sageParams: SageParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const totalStartTime = performance.now();
  try {
    const { message, context } = sageParams;

    if (!userEmail || !message) {
      throw new Error('User email and message are required');
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      'Checking for sage',
      sendUpdate
    );

    const { assistantId, threadId } = user.assistants.sage;

    if (!assistantId || !threadId) {
      throw new Error('User has not summoned the sage');
    }

    const myThread: {
      id: string;
    } = await measurePerformance(
      () => openai.beta.threads.retrieve(threadId),
      'Retrieving thread',
      sendUpdate
    );

    if (context) {
      await measurePerformance(
        () =>
          openai.beta.threads.messages.create(myThread.id, {
            role: 'user',
            content: context,
          }),
        'Creating user context message',
        sendUpdate
      );
    }

    await measurePerformance(
      () =>
        openai.beta.threads.messages.create(myThread.id, {
          role: 'user',
          content: message,
        }),
      'Creating user prompt message',
      sendUpdate
    );

    const stream: any = AssistantStream.fromReadableStream(
      openai.beta.threads.runs
        .stream(myThread.id, {
          assistant_id: assistantId,
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
    insertArchive: (
      userEmail: string,
      purpose: Purpose,
      atlasFile: AtlasFile
    ) => Promise<any>;
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

        const addFile = await dbInstance.insertArchive(
          userEmail,
          Purpose.Sage,
          atlasFile
        );
        if (!addFile) {
          throw new Error('Error adding image to database');
        }
        sendUpdate('notification', 'image_added to database');
      } else {
        sendUpdate('error', 'Failed to generate image');
      }
    });
    stream.on('messageDone', async (event) => {
      if (event.content[0].type === 'text') {
        const { text } = event.content[0];
        const { annotations } = text;
        const citations: string[] = [];

        let index = 0;
        for (let annotation of annotations) {
          text.value = text.value.replace(annotation.text, '[' + index + ']');
          const { file_citation } = annotation as {
            file_citation?: { file_id: string };
          };
          if (file_citation) {
            const citedFile = await openai.files.retrieve(
              file_citation.file_id
            );
            citations.push('[' + index + ']' + citedFile.filename);
          }
          index++;
        }

        console.log(text.value);
        console.log(citations.join('\n'));
      }
    });
    stream.on('event', (event: AssistantStreamEvent) => {
      if (process.env.SAGE_EVENT_DEBUG === 'true') {
        console.info('Event:', event.data);
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
