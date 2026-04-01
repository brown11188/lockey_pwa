export async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.clone().json()) as {
      error?: string;
      message?: string;
    };

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text.trim()) {
        return text;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}
