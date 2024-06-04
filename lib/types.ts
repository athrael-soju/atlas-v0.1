export interface FileEntry {
  id: string;
  userEmail: string;
  name: string;
  path: string;
  uploadDate: number;
  contentType: string;
}

export interface OpenAiFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface FileActionResponse {
  message: string;
  file: FileEntry | OpenAiFileUploadResponse;
}

export interface EmbeddingResponse {
  message: string;
  chunks: any[];
  embeddings: any[];
}

export interface ChunkedDocument {
  id: string;
  chunks: Chunk[];
}

export interface Chunk {
  id: string;
  text: string;
  metadata: {
    file_name: string;
    file_type: string;
    parent_id: string;
    pages: string;
    language: string;
  };
}

export interface Page {
  start: number;
  end: number;
  pageNumber: number;
}

export interface ArchiveParams {
  userEmail: string;
  topK: number;
  topN: number;
}

export interface ForgeParams {
  provider: string;
  maxChunkSize: number;
  minChunkSize: number;
  overlap: number;
  chunkBatch: number;
}

export interface SageParams {
  userEmail: string;
  message?: string;
  name?: string;
  instructions?: string;
  model?: string;
  file_ids?: string[];
}

export interface UserFile {
  id: string;
  purpose: string;
}

export interface User {
  id: string;
  email: string;
  image?: string;
  sageId?: string;
  threadId?: string;
  files: UserFile[];
}

export type MessageProps = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

export type SageAction = 'summon' | 'reform' | 'consult' | 'dismiss';
