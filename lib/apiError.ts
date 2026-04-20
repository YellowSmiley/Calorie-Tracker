const DUPLICATE_ITEM_ERROR = "This item has already been added";

type ErrorPayload = {
  ok?: unknown;
  code?: unknown;
  error?: unknown;
  message?: unknown;
  status?: unknown;
  details?: unknown;
};

export type ApiErrorDetails = {
  message: string;
  code: string | null;
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
  const details = await getApiErrorDetails(response, fallbackMessage);
  return details.message;
}

export async function getApiErrorDetails(
  response: Response,
  fallbackMessage: string,
): Promise<ApiErrorDetails> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    const explicitError =
      asReadableString(payload.message) || asReadableString(payload.error);
    const code = asReadableString(payload.code);

    if (explicitError) {
      return {
        message: explicitError,
        code,
      };
    }
  } catch {
    // Ignore JSON parsing failures and fall back below.
  }

  if (response.status === 409) {
    return {
      message: DUPLICATE_ITEM_ERROR,
      code: null,
    };
  }

  return {
    message: fallbackMessage,
    code: null,
  };
}
