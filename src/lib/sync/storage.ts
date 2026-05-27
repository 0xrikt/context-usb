// Self-contained context storage
// Encodes context data directly in the token (base64), no server-side storage needed
// The MCP endpoint decodes the token to get context data

import type { ContextFile } from "../connectors/types";

interface CompactContext {
  files: Array<{
    t: string; // type
    l: string; // label
    c: string; // content
    v: string; // visibility
  }>;
}

/**
 * Encode context files into a self-contained token string
 * The token is a base64url-encoded JSON of the compact context
 */
export function encodeContextToken(contextFiles: ContextFile[]): string {
  const compact: CompactContext = {
    files: contextFiles.map((f) => ({
      t: f.type,
      l: f.label,
      c: f.content,
      v: f.visibility,
    })),
  };
  const json = JSON.stringify(compact);
  // Encode UTF-8 string to base64url (handles Chinese characters)
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode a self-contained token back into context files
 */
export function decodeContextToken(token: string): ContextFile[] | null {
  try {
    // Restore base64 padding
    const base64 = token
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    // Decode base64 to UTF-8 string (handles Chinese characters)
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const compact: CompactContext = JSON.parse(json);

    if (!compact.files || !Array.isArray(compact.files)) return null;

    return compact.files.map((f) => ({
      id: `synced-${f.t}`,
      type: f.t as ContextFile["type"],
      label: f.l,
      content: f.c,
      version: 1,
      updatedAt: new Date().toISOString(),
      visibility: f.v as ContextFile["visibility"],
    }));
  } catch {
    return null;
  }
}

