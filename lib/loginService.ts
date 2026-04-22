export const CREDENTIALS_LOGIN_FAILED_MESSAGE =
  "Failed to login. Please check your credentials and try again.";
export const GENERIC_SIGN_IN_FAILED_MESSAGE =
  "Failed to sign in. Please try again.";
export const FORGOT_PASSWORD_EMAIL_REQUIRED_MESSAGE =
  "Please enter your email address first.";

export type CredentialsSignInResult = {
  ok?: boolean | null;
  error?: string | null;
};

export function getCredentialsSignInError(
  result: CredentialsSignInResult | null | undefined,
): string | null {
  if (result?.error || !result?.ok) {
    return CREDENTIALS_LOGIN_FAILED_MESSAGE;
  }

  return null;
}

export function getForgotPasswordValidationError(
  email: string,
): string | null {
  if (!email.trim()) {
    return FORGOT_PASSWORD_EMAIL_REQUIRED_MESSAGE;
  }

  return null;
}

export function buildForgotPasswordRequestInit(email: string): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  };
}

export function getForgotPasswordSendingMessage(email: string): string {
  return `Sending password reset link to ${email}...`;
}
