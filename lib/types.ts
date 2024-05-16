export interface FileEntry {
  id: string;
  userId: string;
  name: string;
  path: string;
  uploadDate: number;
  contentType: string;
}

export interface FileActionResponse {
  message: string;
  file: FileEntry;
}

export interface EmbeddingResponse {
  message: string;
  chunks: any[];
  embeddings: any[];
}
