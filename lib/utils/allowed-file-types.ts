import { Purpose } from '@/lib/types';

interface AllowedFileTypes {
  extensions: string[];
  mimeTypes: string[];
}

export const allowedFileTypes: { [key in Purpose]: AllowedFileTypes } = {
  [Purpose.Sage]: {
    extensions: ['xlsx', 'csv'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  [Purpose.Scribe]: {
    extensions: ['pdf', 'txt', 'docx', 'csv', 'xlsx'],
    mimeTypes: [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
};
