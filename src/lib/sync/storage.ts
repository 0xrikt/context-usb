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
  // Use base64url encoding (URL-safe)
  return btoa(json)
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
    const json = atob(padded);
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

// Legacy API compatibility — these are now no-ops since storage is self-contained
export async function saveContext(
  _token: string,
  _contextFiles: ContextFile[]
): Promise<void> {
  // No-op: context is encoded in the token itself
}

export async function loadContext(
  token: string
): Promise<ContextFile[] | null> {
  return decodeContextToken(token);
}

export async function deleteContext(_token: string): Promise<void> {
  // No-op: just discard the token client-side
}
