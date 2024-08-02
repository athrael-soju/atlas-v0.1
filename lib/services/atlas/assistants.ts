import { openai } from '@/lib/client/openai';
import {
  AtlasFile,
  ConsultationParams,
  Purpose,
  ScribeParams,
} from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { measurePerformance } from '@/lib/utils/metrics';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { embedMessage } from '../embedding/openai';
import { query } from '../indexing/pinecone';
import { rerank } from '../reranking/cohere';

export async function retrieveContext(
  userEmail: string,
  scribeParams: ScribeParams,
  sendUpdate: (type: string, message: string) => void
): Promise<{ success: boolean; userEmail: string; context: any }> {
  const { message, topK, topN } = scribeParams;

  try {
    const embeddingResults = await measurePerformance(
      () => embedMessage(userEmail, message),
      'Embedding',
      sendUpdate
    );

    const queryResults = await measurePerformance(
      () => query(userEmail, embeddingResults, topK),
      'Querying',
      sendUpdate
    );

    const rerankingContext = await measurePerformance(
      () => rerank(message, queryResults.context, topN),
      'Reranking',
      sendUpdate
    );

    return { success: true, userEmail, context: rerankingContext };
  } catch (error: any) {
    sendUpdate('error', error.message);
    return { success: false, userEmail, context: error.message };
  }
}

export async function consult(
  userEmail: string,
  purpose: Purpose,
  params: ConsultationParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  try {
    const { message, context } = params;

    if (!userEmail || !message) {
      throw new Error('User email and message are required');
    }

    const dbInstance = await db();

    const user = await measurePerformance(
      () => dbInstance.getUser(userEmail),
      `Checking for summoned ${purpose}`,
      sendUpdate
    );

    if (
      !user.assistants[purpose].assistantId ||
      !user.assistants[purpose].threadId
    ) {
      throw new Error(`User has not summoned the ${purpose} yet`);
    }

    const { assistantId, threadId } = user.assistants[purpose];

    const myThread: {
      id: string;
    } = await measurePerformance(
      () => openai.beta.threads.retrieve(threadId),
      `Retrieving ${purpose} thread`,
      sendUpdate
    );

    if (purpose === Purpose.Scribe) {
      if (context!?.length > 0) {
        await measurePerformance(
          () =>
            openai.beta.threads.messages.create(myThread.id, {
              role: 'user',
              content: context!,
            }),
          `Creating ${purpose} context message`,
          sendUpdate
        );
      }
    }

    await measurePerformance(
      () =>
        openai.beta.threads.messages.create(myThread.id, {
          role: 'user',
          content: message,
        }),
      'Adding user message to thread',
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
      `Handling ${purpose} stream`,
      sendUpdate
    );
  } catch (error: any) {
    sendUpdate('error', error.message);
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
        sendUpdate('image_created', 'image_created');
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
        // TODO: Test citations
        // console.info(text.value);
        // console.info(citations.join('\n'));
      }
    });
    stream.on('event', (event: AssistantStreamEvent) => {
      if (process.env.EVENT_DEBUG === 'true') {
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
      if (event.event === 'thread.run.failed') {
        sendUpdate('error', 'events_failed');
        reject(new Error('Thread run failed'));
      }
    });
    stream.on('error', (error: any) => {
      if (process.env.EVENT_ERROR === 'true') {
        console.error('Error:', error);
        sendUpdate('error', error);
      }
      reject(new Error(error.message));
    });
  });
