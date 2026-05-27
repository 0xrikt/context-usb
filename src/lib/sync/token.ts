// Token generation for MCP sync
// Uses crypto.randomUUID for zero-dependency unique tokens

export function generateToken(): string {
  // Generate a URL-safe random token
  const uuid = crypto.randomUUID();
  // Remove hyphens for a cleaner URL
  return uuid.replace(/-/g, "");
}

export function isValidToken(token: string): boolean {
  // 32 hex characters (UUID without hyphens)
  return /^[a-f0-9]{32}$/.test(token);
}
