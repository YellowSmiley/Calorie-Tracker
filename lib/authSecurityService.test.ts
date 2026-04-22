import {
  buildResetTokenIdentifier,
  buildTokenExpiry,
  getWeakPasswordMessage,
  hashToken,
  normalizeEmail,
} from "./authSecurityService";

describe("authSecurityService", () => {
  test("normalizeEmail lowercases and trims", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });

  test("hashToken returns deterministic sha256 digest", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("buildTokenExpiry adds hour offset", () => {
    const expiry = buildTokenExpiry(2, Date.UTC(2026, 3, 22, 10, 0, 0, 0));
    expect(expiry.toISOString()).toBe("2026-04-22T12:00:00.000Z");
  });

  test("buildResetTokenIdentifier prefixes normalized email", () => {
    expect(buildResetTokenIdentifier("  Test@Example.COM ")).toBe(
      "reset:test@example.com",
    );
  });

  test("getWeakPasswordMessage validates all password rules", () => {
    expect(getWeakPasswordMessage("alllowercase1!")).toBe(
      "Password must contain at least one uppercase letter",
    );
    expect(getWeakPasswordMessage("ValidPass1!")).toBeNull();
  });
});
