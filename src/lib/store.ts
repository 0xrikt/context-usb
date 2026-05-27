import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RawEntry, ContextFile, ContextFileType } from './connectors/types';
import { CONTEXT_FILE_LABELS } from './connectors/types';

interface AppState {
  // Raw entries
  rawEntries: RawEntry[];
  addEntries: (entries: RawEntry[]) => void;
  clearEntries: () => void;

  // Context files
  contextFiles: ContextFile[];
  setContextFiles: (files: ContextFile[]) => void;
  updateContextFile: (id: string, content: string) => void;
  toggleVisibility: (id: string) => void;

  // MCP sync
  mcpToken: string | null;
  setMcpToken: (token: string | null) => void;

  // UI state
  isProcessing: boolean;
  processingStep: string;
  processingProgress: number;
  setProcessing: (isProcessing: boolean, step?: string, progress?: number) => void;

  // Reset
  resetAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      rawEntries: [],
      addEntries: (entries) =>
        set((state) => ({
          rawEntries: [...state.rawEntries, ...entries],
        })),
      clearEntries: () => set({ rawEntries: [] }),

      contextFiles: [],
      setContextFiles: (files) => set({ contextFiles: files }),
      mcpToken: null,
      setMcpToken: (token) => set({ mcpToken: token }),
      updateContextFile: (id, content) =>
        set((state) => ({
          contextFiles: state.contextFiles.map((f) =>
            f.id === id
              ? { ...f, content, version: f.version + 1, updatedAt: new Date().toISOString() }
              : f
          ),
        })),
      toggleVisibility: (id) =>
        set((state) => ({
          contextFiles: state.contextFiles.map((f) =>
            f.id === id
              ? {
                  ...f,
                  visibility:
                    f.visibility === 'public'
                      ? 'private'
                      : f.visibility === 'private'
                        ? 'hidden'
                        : 'public',
                }
              : f
          ),
        })),

      isProcessing: false,
      processingStep: '',
      processingProgress: 0,
      setProcessing: (isProcessing, step = '', progress = 0) =>
        set({ isProcessing, processingStep: step, processingProgress: progress }),

      resetAll: () =>
        set({
          rawEntries: [],
          contextFiles: [],
          mcpToken: null,
          isProcessing: false,
          processingStep: '',
          processingProgress: 0,
        }),
    }),
    {
      name: 'context-usb-storage',
      partialize: (state) => ({
        rawEntries: state.rawEntries,
        contextFiles: state.contextFiles,
        mcpToken: state.mcpToken,
      }),
    }
  )
);

export function createEmptyContextFiles(): ContextFile[] {
  const types: ContextFileType[] = [
    'identity',
    'interests',
    'growth-journal',
    'relationships',
    'goals',
    'voice',
  ];
  return types.map((type) => ({
    id: `ctx-${type}`,
    type,
    label: CONTEXT_FILE_LABELS[type],
    content: '',
    version: 0,
    updatedAt: new Date().toISOString(),
    visibility: type === 'relationships' ? 'private' : 'public',
  }));
}
