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
    pages?: number[];
    language?: string;
  };
}

export interface Page {
  start: number;
  end: number;
  pageNumber: number;
}
