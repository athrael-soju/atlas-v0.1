export const toAscii = (str: string): string => {
  return str.replace(/[^\x00-\x7F]/g, '');
};
