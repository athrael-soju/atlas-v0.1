import {
  ForgeParams,
  ScribeParams,
  SageParams,
  Purpose,
  ArchivistOnboardingParams,
  ArchivistParams,
} from '@/lib/types';

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
        const message = buffer.slice(0, boundary + 1);
        buffer = buffer.slice(boundary + 1);
        if (message) {
          onUpdate(message);
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  }
  if (buffer.trim()) {
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

    await readStream(response, onUpdate);
  } catch (error) {
    onUpdate(`Error: ${error}`);
  }
};

export const scribe = async (
  content: string,
  scribeParams: ScribeParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('scribeParams', JSON.stringify(scribeParams));
  try {
    const response = await fetch(`/api/atlas/scribe`, {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    onUpdate(`Error: ${error}`);
  }
};

export const sage = async (
  userEmail: string,
  purpose: Purpose,
  sageParams: SageParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('userEmail', userEmail);
  formData.append('purpose', purpose);
  formData.append('sageParams', JSON.stringify(sageParams));

  try {
    const response = await fetch('/api/atlas/sage', {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    onUpdate(`Error: ${error}`);
  }
};

export const archivist = async (
  userEmail: string,
  action: string,
  onboardingParams: ArchivistParams | ArchivistOnboardingParams,
  onUpdate: (message: string) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('userEmail', userEmail);
  formData.append('action', action);
  formData.append('archivistParams', JSON.stringify(onboardingParams));

  try {
    const response = await fetch('/api/atlas/archivist', {
      method: 'POST',
      body: formData,
    });

    await readStream(response, onUpdate);
  } catch (error) {
    onUpdate(`Error: ${error}`);
  }
};
