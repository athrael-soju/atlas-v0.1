const url = process.env.SERVER_URL || 'http://localhost:3000';

export const embedMessage = async (
  userEmail: string,
  text: string
): Promise<any> => {
  const response = await fetch(`${url}/api/openai/embed-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, text }),
  });

  if (!response.ok) {
    throw new Error(
      `Error Embedding Message: ${text}. Response: ${response.statusText}`
    );
  }
  const jsonResponse = await response.json();
  return jsonResponse;
};
