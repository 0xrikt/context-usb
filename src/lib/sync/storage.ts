// Storage abstraction for synced context data
// Uses in-memory Map as primary storage (works without external services)
// Can be upgraded to Vercel KV later for persistence across cold starts

import type { ContextFile } from "../connectors/types";

interface StoredContext {
  contextFiles: Array<{
    type: string;
    label: string;
    content: string;
    visibility: string;
  }>;
  updatedAt: string;
}

// In-memory store (resets on cold start, sufficient for personal use)
const memoryStore = new Map<string, StoredContext>();

export async function saveContext(
  token: string,
  contextFiles: ContextFile[]
): Promise<void> {
  const data: StoredContext = {
    contextFiles: contextFiles.map((f) => ({
      type: f.type,
      label: f.label,
      content: f.content,
      visibility: f.visibility,
    })),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.set(`ctx:${token}`, data);
}

export async function loadContext(
  token: string
): Promise<ContextFile[] | null> {
  const data = memoryStore.get(`ctx:${token}`) ?? null;

  if (!data?.contextFiles) return null;

  return data.contextFiles.map((f) => ({
    id: `synced-${f.type}`,
    type: f.type as ContextFile["type"],
    label: f.label,
    content: f.content,
    version: 1,
    updatedAt: data.updatedAt,
    visibility: f.visibility as ContextFile["visibility"],
  }));
}

export async function deleteContext(token: string): Promise<void> {
  memoryStore.delete(`ctx:${token}`);
}
