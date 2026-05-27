export interface RawEntry {
  id: string;
  source: 'flomo' | 'notion' | 'evernote' | 'weibo' | 'paste' | 'file';
  content: string;
  createdAt: string;
  tags: string[];
  metadata: {
    url?: string;
    title?: string;
    type?: string;
    wordCount: number;
  };
}

export interface ContextFile {
  id: string;
  type: ContextFileType;
  label: string;
  content: string;
  version: number;
  updatedAt: string;
  visibility: 'public' | 'private' | 'hidden';
}

export type ContextFileType =
  | 'identity'
  | 'interests'
  | 'growth-journal'
  | 'relationships'
  | 'goals'
  | 'voice';

export const CONTEXT_FILE_LABELS: Record<ContextFileType, string> = {
  identity: '关于我',
  interests: '我的兴趣',
  'growth-journal': '最近在想什么',
  relationships: '我的社交世界',
  goals: '我的目标',
  voice: '我的表达风格',
};

export const CONTEXT_FILE_ICONS: Record<ContextFileType, string> = {
  identity: 'User',
  interests: 'Sparkles',
  'growth-journal': 'BookOpen',
  relationships: 'Users',
  goals: 'Target',
  voice: 'MessageCircle',
};
