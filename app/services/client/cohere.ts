const url = process.env.SERVER_URL || 'http://localhost:3000';

export const rerank = async (
  content: string,
  queryResults: any,
  topN: number
): Promise<any> => {
  const response = await fetch(`${url}/api/cohere/rerank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, queryResults, topN }),
  });

  if (!response.ok) {
    throw new Error(`Error reranking: ${response.statusText}`);
  }
  const jsonResponse = await response.json();
  return jsonResponse;
};
