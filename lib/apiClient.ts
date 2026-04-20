type ApiSuccessEnvelope<T> = {
  ok: true;
  status: number;
  data: T;
  timestamp: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasDataEnvelope<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  return (
    isObject(value) && "ok" in value && value.ok === true && "data" in value
  );
}

export function unwrapApiData<T>(payload: unknown): T {
  if (hasDataEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}
