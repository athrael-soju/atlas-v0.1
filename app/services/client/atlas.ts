const readStream = async (
  response: Response,
  onUpdate: (message: string) => void,
  isFinalResult: boolean = false
) => {
  if (!response.ok) {
    throw new Error('Failed to process the request');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      chunk.split('\n\n').forEach((message) => {
        if (message.startsWith('data: ')) {
          const data = message.replace('data: ', '');
          if (isFinalResult && data.startsWith('Final Result:')) {
            const result = JSON.parse(data.replace('Final Result:', '').trim());
            onUpdate(result);
          } else {
            onUpdate(data);
          }
        }
      });
    }
  }
};

export const process = async (
  files: FileList,
  userEmail: string,
  onUpdate: (message: string) => void
) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('files', file));
  formData.append('userEmail', userEmail);

  const response = await fetch('/api/atlas/process', {
    method: 'POST',
    body: formData,
  });

  await readStream(response, onUpdate);
};

export const retrieve = async (
  serverUrl: string,
  userEmail: string,
  content: string,
  topK: number,
  topN: number,
  onUpdate: (message: string) => void
) => {
  const formData = new FormData();
  formData.append('userEmail', userEmail);
  formData.append('content', content);
  formData.append('topK', topK.toString());
  formData.append('topN', topN.toString());

  const response = await fetch(`${serverUrl}/api/atlas/retrieve`, {
    method: 'POST',
    body: formData,
  });

  await readStream(response, onUpdate, true);
};
