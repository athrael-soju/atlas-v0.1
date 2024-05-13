export interface FileEntry {
  id: string;
  userId: string;
  name: string;
  path: string;
  uploadDate: number;
  contentType: string;
}

export interface UploadResponse {
  file: FileEntry;
  fileWrittenToDisk: boolean;
  fileWrittenToKV: [];
  message: string;
  userId: string;
}

export interface FileUploadResponse {
  filesystem: string;
  uploaded: boolean;
  path: string;
}
