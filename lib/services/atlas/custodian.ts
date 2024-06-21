import { openai } from '@/lib/client/openai';
import {
  AssistantParams,
  AtlasAssistant,
  CustodianParams,
  Purpose,
} from '@/lib/types';
import { db } from '@/lib/services/db/mongodb';
import { measurePerformance } from '@/lib/utils/metrics';

export async function summon(
  userEmail: string,
  custodianParams: CustodianParams,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const dbInstance = await db();

  const user = await measurePerformance(
    () => dbInstance.getUser(userEmail),
    'Checking for assistants',
    sendUpdate
  );

  const { sage, scribe } = user.assistants || {};
  if (sage?.assistantId || scribe?.assistantId) {
    throw new Error('User already has summoned required assistants');
  }

  // Summon Sage
  await summonAssistant(
    userEmail,
    Purpose.Sage,
    custodianParams.assistants.sage,
    dbInstance,
    sendUpdate
  );

  // Summon Scribe
  await summonAssistant(
    userEmail,
    Purpose.Scribe,
    custodianParams.assistants.scribe,
    dbInstance,
    sendUpdate
  );
}

async function summonAssistant(
  userEmail: string,
  purpose: Purpose,
  assistant: AssistantParams,
  dbInstance: any,
  sendUpdate: (type: string, message: string) => void
) {
  const { name, instructions, model } = assistant;
  let assistantCreated;

  switch (purpose) {
    case Purpose.Sage:
      assistantCreated = await measurePerformance(
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
      break;
    case Purpose.Scribe:
      assistantCreated = await measurePerformance(
        () =>
          openai.beta.assistants.create({
            instructions,
            name,
            model,
          }),
        'Summoning scribe',
        sendUpdate
      );
      break;
    default:
      throw new Error('Invalid assistant type provided');
  }

  const thread: { id: string } = await measurePerformance(
    () => openai.beta.threads.create(),
    `Creating thread for ${purpose}`,
    sendUpdate
  );

  if (!assistantCreated.id || !thread.id) {
    throw new Error(`Failed to create ${purpose}`);
  }

  const user = await dbInstance.getUser(userEmail);

  const updatedAssistants = {
    ...user.assistants,
    [purpose]: {
      assistantId: assistantCreated.id,
      threadId: thread.id,
      assistantType: purpose,
      files: [],
    },
  };

  const assistantsCreatedInDB = await measurePerformance(
    () =>
      dbInstance.updateUser(userEmail, {
        assistants: updatedAssistants,
      }),
    `Updating DB with ${purpose} details`,
    sendUpdate
  );

  if (!assistantsCreatedInDB) {
    throw new Error(`Failed to update ${purpose} details in DB`);
  }
}

export async function dismiss(
  userEmail: string,
  sendUpdate: (type: string, message: string) => void
): Promise<any> {
  const dbInstance = await db();

  const user = await measurePerformance(
    () => dbInstance.getUser(userEmail),
    'Checking for assistants',
    sendUpdate
  );

  const { assistants } = user;
  if (!assistants.sage.assistantId || !assistants.scribe.assistantId) {
    throw new Error('User has not summoned assistants');
  }

  const { sageDeleted, scribeDeleted } = await measurePerformance(
    () => dismissAssistants(assistants),
    'Dismissing assistants from OpenAI',
    sendUpdate
  );

  if (!sageDeleted || !scribeDeleted) {
    throw new Error('Failed to dismiss assistants from OpenAI');
  }

  const assistantsDeleted = await measurePerformance(
    () => dbInstance.dismissAssistants(userEmail),
    'Updating DB to dismiss assistants',
    sendUpdate
  );

  if (!assistantsDeleted) {
    throw new Error('Failed to dismiss assistants from DB');
  }
}

async function dismissAssistants(assistants: {
  sage: AtlasAssistant;
  scribe: AtlasAssistant;
}) {
  const sageDeleted = await openai.beta.assistants.del(
    assistants.sage.assistantId
  );
  const scribeDeleted = await openai.beta.assistants.del(
    assistants.scribe.assistantId
  );
  return { sageDeleted, scribeDeleted };
}
