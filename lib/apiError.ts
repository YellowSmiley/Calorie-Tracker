const DUPLICATE_ITEM_ERROR = "This item has already been added";

type ErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function asReadableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const payload = (await response.json()) as ErrorPayload;
    const explicitError =
      asReadableString(payload.error) || asReadableString(payload.message);

    if (explicitError) {
      return explicitError;
    }
  } catch {
    // Ignore JSON parsing failures and fall back below.
  }

  if (response.status === 409) {
    return DUPLICATE_ITEM_ERROR;
  }

  return fallbackMessage;
}
