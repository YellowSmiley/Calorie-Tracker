import { getApiErrorDetails, getApiErrorMessage } from "./apiError";

function mockResponse(status: number, payload: unknown): Response {
  return {
    status,
    json: async () => {
      if (payload instanceof Error) {
        throw payload;
      }
      return payload;
    },
  } as Response;
}

describe("getApiErrorMessage", () => {
  it("returns API error field when present", async () => {
    const response = mockResponse(409, {
      error: "Duplicate item detected",
    });

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "Duplicate item detected",
    );
  });

  it("prefers API message over error when both are present", async () => {
    const response = mockResponse(400, {
      message: "Validation failed",
      error: "Legacy validation error",
      code: "VALIDATION_ERROR",
    });

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "Validation failed",
    );
  });

  it("returns duplicate fallback message for empty 409 body", async () => {
    const response = mockResponse(409, new Error("Invalid JSON"));

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "This item has already been added",
    );
  });

  it("returns provided fallback message for non-409 parse failures", async () => {
    const response = mockResponse(500, new Error("Invalid JSON"));

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "Fallback error",
    );
  });

  it("returns structured details with code when available", async () => {
    const response = mockResponse(401, {
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    });

    await expect(
      getApiErrorDetails(response, "Fallback error"),
    ).resolves.toEqual({
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });
});
