import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("returns API error field when present", async () => {
    const response = new Response(
      JSON.stringify({ error: "Duplicate item detected" }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "Duplicate item detected",
    );
  });

  it("returns duplicate fallback message for empty 409 body", async () => {
    const response = new Response("", {
      status: 409,
      headers: { "Content-Type": "text/plain" },
    });

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "This item has already been added",
    );
  });

  it("returns provided fallback message for non-409 parse failures", async () => {
    const response = new Response("not-json", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });

    await expect(getApiErrorMessage(response, "Fallback error")).resolves.toBe(
      "Fallback error",
    );
  });
});
