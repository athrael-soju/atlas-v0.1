import {
  ForgeParams,
  ArchiveParams,
  SageParams,
  SageAction,
} from '@/lib/types';

const processMessage = (
  completeMessage: string,
  onUpdate: (message: string) => void
) => {
  if (completeMessage.startsWith('data: ')) {
    const data = completeMessage.replace('data: ', '');
    onUpdate(data);
  } else if (completeMessage.startsWith('sage_data: ')) {
    const data = completeMessage.replace('sage_data: ', '');
    onUpdate(data);
  } else if (completeMessage.startsWith('notification: ')) {
    const data = completeMessage.replace('notification: ', '');
    console.log(data);
    //onUpdate(data); // Showing notification messages causes issues
  } else {
    console.log('Unknown message:', completeMessage);
    onUpdate(completeMessage);
  }
};

const readStream = async (
  response: Response,
  onUpdate: (message: string) => void
): Promise<void> => {
  if (!response.ok) {
    throw new Error('Failed to process the request');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');

      while (boundary !== -1) {
        const completeMessage = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2); // Remove processed part
        boundary = buffer.indexOf('\n\n');
        processMessage(completeMessage, onUpdate);
      }
    }
  }
};

export const forge = async (
  files: FileList,
  userEmail: string,
  forgeParams: ForgeParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('files', file));
  formData.append('userEmail', userEmail);
  formData.append('forgeParams', JSON.stringify(forgeParams));

  try {
    const response = await fetch('/api/atlas/forge', {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    console.error('Error in process:', error);
    onUpdate(`Error: ${error}`);
  }
};

export const scribe = async (
  content: string,
  archiveParams: ArchiveParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('archiveParams', JSON.stringify(archiveParams));
  try {
    const response = await fetch(`/api/atlas/scribe`, {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    console.error('Error in retrieve:', error);
    onUpdate(`Error: ${error}`);
  }
};

// Update sage function to properly handle markdown content
export const sage = async (
  action: SageAction,
  sageParams: SageParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('action', action);
  formData.append('sageParams', JSON.stringify(sageParams));

  try {
    const response = await fetch('/api/atlas/sage', {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    console.error('Error in process:', error);
    onUpdate(`Error: ${error}`);
  }
};
