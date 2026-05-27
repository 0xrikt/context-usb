// Shared types between extension components
// Mirrors the web app's types but kept standalone for extension independence

export type ContextFileType =
  | "identity"
  | "interests"
  | "growth-journal"
  | "relationships"
  | "goals"
  | "voice";

export interface ContextFile {
  id: string;
  type: ContextFileType;
  label: string;
  content: string;
  version: number;
  updatedAt: string;
  visibility: "public" | "private" | "hidden";
}

// Message types for chrome.runtime messaging
export type MessageType =
  | { type: "CONTEXT_UPDATED"; contextFiles: ContextFile[] }
  | { type: "GET_CONTEXT" }
  | { type: "INJECT_CONTEXT" }
  | { type: "CONTEXT_RESPONSE"; contextFiles: ContextFile[] | null };
