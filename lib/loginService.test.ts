import {
  buildForgotPasswordRequestInit,
  CREDENTIALS_LOGIN_FAILED_MESSAGE,
  FORGOT_PASSWORD_EMAIL_REQUIRED_MESSAGE,
  getCredentialsSignInError,
  getForgotPasswordSendingMessage,
  getForgotPasswordValidationError,
} from "./loginService";

describe("loginService", () => {
  describe("getCredentialsSignInError", () => {
    it("returns error when result is missing", () => {
      expect(getCredentialsSignInError(undefined)).toBe(
        CREDENTIALS_LOGIN_FAILED_MESSAGE,
      );
    });

    it("returns error when ok is false", () => {
      expect(getCredentialsSignInError({ ok: false })).toBe(
        CREDENTIALS_LOGIN_FAILED_MESSAGE,
      );
    });

    it("returns error when provider returns error", () => {
      expect(getCredentialsSignInError({ ok: true, error: "invalid" })).toBe(
        CREDENTIALS_LOGIN_FAILED_MESSAGE,
      );
    });

    it("returns null when sign-in succeeds", () => {
      expect(getCredentialsSignInError({ ok: true, error: null })).toBeNull();
    });
  });

  describe("getForgotPasswordValidationError", () => {
    it("returns validation error when email is empty", () => {
      expect(getForgotPasswordValidationError("")).toBe(
        FORGOT_PASSWORD_EMAIL_REQUIRED_MESSAGE,
      );
    });

    it("returns validation error when email is whitespace", () => {
      expect(getForgotPasswordValidationError("   ")).toBe(
        FORGOT_PASSWORD_EMAIL_REQUIRED_MESSAGE,
      );
    });

    it("returns null when email is present", () => {
      expect(getForgotPasswordValidationError("user@test.com")).toBeNull();
    });
  });

  describe("buildForgotPasswordRequestInit", () => {
    it("builds POST request with json payload", () => {
      expect(buildForgotPasswordRequestInit("user@test.com")).toEqual({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com" }),
      });
    });
  });

  describe("getForgotPasswordSendingMessage", () => {
    it("returns deterministic loading text", () => {
      expect(getForgotPasswordSendingMessage("user@test.com")).toBe(
        "Sending password reset link to user@test.com...",
      );
    });
  });
});
