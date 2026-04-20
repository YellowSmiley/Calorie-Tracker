import { unwrapApiData } from "./apiClient";

describe("unwrapApiData", () => {
  test("returns data field when response uses success envelope", () => {
    const payload = {
      ok: true,
      status: 200,
      data: { value: 42 },
      timestamp: "2026-04-20T00:00:00.000Z",
    };

    expect(unwrapApiData<{ value: number }>(payload)).toEqual({ value: 42 });
  });

  test("returns payload directly for legacy responses", () => {
    const payload = { value: 42 };
    expect(unwrapApiData<{ value: number }>(payload)).toEqual({ value: 42 });
  });
});
