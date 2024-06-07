import {
  ForgeParams,
  ArchiveParams,
  SageParams,
  SageAction,
} from '@/lib/types';

const readStream = async (
  response: Response,
  bound: string,
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

    // TODO: Handle Sage/Scribe/Forge
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf(bound);

      while (boundary !== -1) {
        const message = buffer.slice(0, boundary + 1);
        buffer = buffer.slice(boundary + 1);
        if (message.startsWith('data: ')) {
          const data = message.replace('data: ', '');

          if (data.startsWith('Final Result:')) {
            const result = JSON.parse(data.replace('Final Result:', '').trim());
            onUpdate(result);
          } else {
            onUpdate(data);
          }
        } else {
          onUpdate(message);
        }
        boundary = buffer.indexOf(bound);
      }
    }
  }

  if (buffer) {
    onUpdate(buffer);
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

    await readStream(response, '\n\n', onUpdate);
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

    await readStream(response, '\n\n', onUpdate);
  } catch (error) {
    console.error('Error in retrieve:', error);
    onUpdate(`Error: ${error}`);
  }
};

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

    await readStream(response, '}{', onUpdate);
  } catch (error) {
    console.error('Error in process:', error);
    onUpdate(`Error: ${error}`);
  }
};
