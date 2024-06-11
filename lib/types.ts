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

export interface ScribeParams {
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

export interface ArchivistParams {
  userEmail: string;
  fileIds?: string[];
}

export enum Purpose {
  Scribe = 'scribe',
  Sage = 'sage',
}

export interface FileActionResponse {
  message: string;
  file: AtlasFile;
}

export interface AtlasFile {
  id: string;
  name: string;
  userEmail: string;
  content: File | object;
  path: string;
  uploadDate: number;
  purpose: Purpose.Scribe | Purpose.Sage;
}

export interface AtlasUser {
  id: string;
  email: string;
  image?: string;
  sageId?: string;
  threadId?: string;
  files: AtlasFile[];
}

export interface DataTableProps {
  userEmail: string;
  files: AtlasFile[];
  handleFetchFiles: (userEmail: string) => Promise<void>;
}

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode;
}

export type MessageProps = {
  role: 'text' | 'code' | 'image' | 'spinner';
  text: string;
};

export type SageAction = 'summon' | 'reform' | 'consult' | 'dismiss';
