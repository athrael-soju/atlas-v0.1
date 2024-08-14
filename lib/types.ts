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
  cohereTopN: number;
  cohereRelevanceThreshold: number;
  pineconeTopK: number;
}

export interface ForgeParams {
  parsingProvider: string;
  maxChunkSize: number;
  minChunkSize: number;
  chunkOverlap: number;
  chunkingStrategy: string;
  partitioningStrategy: string;
  chunkBatch: number;
}

export interface CustomizationParams {
  speech: boolean;
}

export interface SageParams {
  message: string;
}

export interface ConsultationParams {
  message: string;
  context?: string;
}

export interface AssistantParams {
  name: string;
  instructions: string;
  model: string;
  file_ids: string[];
}

export interface CustodianParams {
  assistants: { sage: AssistantParams; scribe: AssistantParams };
}

export interface FileActionParams {
  fileId?: string;
  purpose: Purpose;
}

export type ArchivistParams =
  | FileActionParams
  | OnboardingParams
  | UserConfigParams
  | CustomizationConfigParams;

export interface OnboardingParams {
  userName: string;
  description: string;
  selectedAssistant: 'scribe' | 'sage';
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

export interface AtlasAssistant {
  assistantId: string;
  threadId: string;
  purpose: Purpose;
  files?: AtlasFile[];
  settings: any;
}

export interface ProfileParams {
  name?: string;
  dob?: Date;
  language?: string;
  username?: string;
  email?: string;
  bio?: string;
}

export interface ProfileConfigParams {
  profile: ProfileParams;
}

export interface ScribeConfigParams {
  scribe: ScribeParams;
}

export interface CustomizationConfigParams {
  customization: CustomizationParams;
}

export interface ForgeConfigParams {
  forge: ForgeParams;
}

export type UserConfigParams = Partial<
  ProfileConfigParams &
    ScribeConfigParams &
    ForgeConfigParams &
    CustomizationConfigParams
>;

export interface AtlasUser {
  id: string;
  email: string;
  image?: string;
  assistants: { sage: AtlasAssistant; scribe: AtlasAssistant };
  preferences: {
    name: string | null;
    description: string | null;
    selectedAssistant: 'sage' | 'scribe' | null;
  };
  configuration: {
    profile?: ProfileConfigParams['profile'] | null;
    scribe?: ScribeConfigParams['scribe'] | null;
    forge?: ForgeConfigParams['forge'] | null;
    customization?: CustomizationConfigParams['customization'] | null;
  };
}

export interface MessageFormProps {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export interface FileUploadManagerProps {
  onChange: (newFiles: string[]) => void;
  assistantSelected: Purpose;
  userEmail: string;
  uploadedFiles: string[];
  isUploadCompleted: boolean;
  setIsUploadCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFiles: (userEmail: string) => Promise<void>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DropzoneProps {
  onChange: (newFiles: string[]) => void;
  userEmail: string;
  assistantSelected: Purpose;
  isUploadCompleted: boolean;
  setIsUploadCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFiles: (userEmail: string) => void;
}

export interface DataTableProps {
  userEmail: string;
  files: AtlasFile[];
  purpose: Purpose;
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
  message: string;
  latency?: number;
};

export type CustodianAction = 'summon' | 'reform' | 'dismiss';
