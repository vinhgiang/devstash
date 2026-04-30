import { Code, Sparkles, Terminal, StickyNote, File, Image, Link2 } from 'lucide-react';

export const ICON_COMPONENTS = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: Link2,
} as const;

export type IconName = keyof typeof ICON_COMPONENTS;

export const ITEM_TYPE_COLORS = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  file: '#6b7280',
  image: '#ec4899',
  link: '#10b981',
} as const;
