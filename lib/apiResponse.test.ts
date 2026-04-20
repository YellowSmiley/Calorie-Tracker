/** @jest-environment node */

import { apiBadRequest, apiSuccess, apiUnauthorized } from "./apiResponse";

describe("apiResponse helpers", () => {
  test("apiSuccess returns standardized success envelope", async () => {
    const response = apiSuccess({ item: { id: "abc" } }, 201);
    const payload = (await response.json()) as {
      ok: boolean;
      status: number;
      data: { item: { id: string } };
      item: { id: string };
      timestamp: string;
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe(201);
    expect(payload.data.item.id).toBe("abc");
    expect(payload.item.id).toBe("abc");
    expect(typeof payload.timestamp).toBe("string");
  });

  test("apiUnauthorized keeps legacy error string and adds code/message", async () => {
    const response = apiUnauthorized();
    const payload = (await response.json()) as {
      ok: boolean;
      status: number;
      code: string;
      message: string;
      error: string;
    };

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(payload.message).toBe("Unauthorized");
    expect(payload.error).toBe("Unauthorized");
  });

  test("apiBadRequest includes custom code and details", async () => {
    const response = apiBadRequest("Invalid payload", "VALIDATION_ERROR", {
      field: "mealType",
    });

    const payload = (await response.json()) as {
      code: string;
      details?: { field: string };
    };

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details?.field).toBe("mealType");
  });
});
