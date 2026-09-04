/**
 * Maps backend auth/database errors to user-friendly messages.
 * Raw backend error text is never shown to the user.
 */
export function friendlyAuthError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "That email and password combination doesn't match an account.";
  }
  if (message.includes("email not confirmed")) {
    return "This account still needs to be confirmed. Check your inbox for the confirmation email.";
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "An account already exists for this email. Try logging in instead.";
  }
  if (
    message.includes("password should be") ||
    message.includes("weak password") ||
    message.includes("known to be weak") ||
    message.includes("pwned")
  ) {
    return "That password is too easy to guess. Choose a less common password that still meets every requirement listed.";
  }
  if (
    message.includes("error sending") ||
    message.includes("smtp") ||
    message.includes("send email") ||
    message.includes("email_provider")
  ) {
    return "We couldn't send the email just now. Please try again in a few minutes — if it keeps failing, contact support.";
  }
  if (
    message.includes("over_email_send_rate_limit") ||
    message.includes("rate limit") ||
    message.includes("too many")
  ) {
    return "Too many email requests for now. Please wait a few minutes, then use Resend again.";
  }
  if (message.includes("expired") || message.includes("invalid token")) {
    return "This link is no longer valid. Request a new recovery email.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

export function friendlyDataError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const message = raw.toLowerCase();

  if (message.includes("permission") || message.includes("row-level security")) {
    return "You don't have access to this record.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return "We couldn't save your changes. Please try again.";
}
