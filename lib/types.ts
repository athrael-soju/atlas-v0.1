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
  parsingStrategy: string;
}

export interface SageParams {
  userEmail: string;
  message?: string;
  context?: string;
  name?: string;
  instructions?: string;
  model?: string;
  file_ids?: string[];
}

export interface ArchivistParams {
  userEmail: string;
  fileId?: string;
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

export interface MessageFormProps {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export interface DropzoneProps {
  onChange: (newFiles: string[]) => void;
  fileExtension?: string;
  userEmail: string;
  forgeParams: ForgeParams;
  isUploadCompleted: boolean;
  setIsUploadCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFiles: (userEmail: string) => void;
}

export interface DataTableProps {
  userEmail: string;
  files: AtlasFile[];
  handleFetchFiles: (userEmail: string) => Promise<void>;
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode;
}
export enum MessageRole {
  User = 'user',
  Text = 'text',
  Code = 'code',
  Error = 'error',
  Image = 'image',
  Spinner = 'spinner',
  Assistant = 'assistant',
  System = 'system',
}

export type MessageProps = {
  role: MessageRole;
  text: string;
};

export type SageAction = 'summon' | 'reform' | 'consult' | 'dismiss';
