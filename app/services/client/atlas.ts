export const process = async (
  files: FileList,
  userEmail: string,
  onUpdate: (message: string) => void
) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  formData.append('userEmail', userEmail);

  const response = await fetch('/api/atlas/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload files');
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
          onUpdate(data);
        }
      });
    }
  }
};
