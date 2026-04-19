import { getClientIp } from "./blacklist";

describe("blacklist helper", () => {
  it("returns first forwarded IP", () => {
    const headers = {
      get: (name: string) =>
        name === "x-forwarded-for" ? "203.0.113.10, 198.51.100.1" : null,
    };

    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const headers = {
      get: (name: string) => (name === "x-real-ip" ? "198.51.100.7" : null),
    };

    expect(getClientIp(headers)).toBe("198.51.100.7");
  });

  it("returns null when no IP headers are present", () => {
    const headers = {
      get: () => null,
    };

    expect(getClientIp(headers)).toBeNull();
  });
});
