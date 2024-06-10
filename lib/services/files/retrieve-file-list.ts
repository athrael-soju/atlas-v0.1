import { AtlasFile } from '@/lib/types';

export const fetchFileList = async (
  userEmail: string
): Promise<AtlasFile[]> => {
  const response = await fetch(`/api/files/${userEmail}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const files: AtlasFile[] = await response.json();
    return files;
  }

  throw new Error('Failed to fetch file list');
};
