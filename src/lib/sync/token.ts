// Token validation for self-contained context tokens
// Tokens are base64url-encoded JSON strings

export function isValidToken(token: string): boolean {
  // Self-contained tokens are base64url strings (minimum viable length)
  // Must be at least 10 chars and only contain base64url characters
  return token.length >= 10 && /^[A-Za-z0-9_-]+$/.test(token);
}
