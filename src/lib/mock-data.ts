export type ContentType = "TEXT" | "FILE" | "URL";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isFavorite: boolean;
  itemIds: string[];
}

export interface Item {
  id: string;
  title: string;
  contentType: ContentType;
  content?: string;
  url?: string;
  description?: string;
  language?: string;
  isFavorite: boolean;
  isPinned: boolean;
  typeId: string;
  collectionIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const currentUser: User = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  isPro: true,
};

export const itemTypes: ItemType[] = [
  { id: "type_snippet", name: "Snippets", icon: "Code", color: "#3b82f6", isSystem: true },
  { id: "type_prompt", name: "Prompts", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { id: "type_command", name: "Commands", icon: "Terminal", color: "#f97316", isSystem: true },
  { id: "type_note", name: "Notes", icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_file", name: "Files", icon: "File", color: "#6b7280", isSystem: true },
  { id: "type_image", name: "Images", icon: "Image", color: "#ec4899", isSystem: true },
  { id: "type_link", name: "Links", icon: "Link", color: "#10b981", isSystem: true },
];

export const collections: Collection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemIds: ["item_useauth", "item_api_error", "item_use_debounce"],
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemIds: ["item_py_decorator"],
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemIds: ["item_ctx_system"],
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemIds: ["item_useauth", "item_py_decorator"],
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemIds: ["item_git_reset"],
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemIds: ["item_code_review_prompt"],
  },
];

export const items: Item[] = [
  {
    id: "item_useauth",
    title: "useAuth Hook",
    contentType: "TEXT",
    description: "Custom authentication hook for React applications",
    language: "typescript",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthP')
  }
  return context
}`,
    isFavorite: true,
    isPinned: true,
    typeId: "type_snippet",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "auth", "hooks"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "item_api_error",
    title: "API Error Handling Pattern",
    contentType: "TEXT",
    description: "Fetch wrapper with exponential backoff retry logic",
    language: "typescript",
    content: `export async function fetchWithRetry(url: string, options?: RequestInit) {
  // retry logic here
}`,
    isFavorite: false,
    isPinned: true,
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["api", "error-handling", "typescript"],
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
  },
  {
    id: "item_use_debounce",
    title: "useDebounce Hook",
    contentType: "TEXT",
    description: "Debounce values in React components",
    language: "typescript",
    content: `export function useDebounce<T>(value: T, delay: number): T {
  // implementation
}`,
    isFavorite: false,
    isPinned: false,
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["react", "hooks", "performance"],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "item_py_decorator",
    title: "Timing Decorator",
    contentType: "TEXT",
    description: "Python decorator to measure function execution time",
    language: "python",
    content: `def timing(func):
    def wrapper(*args, **kwargs):
        ...
    return wrapper`,
    isFavorite: false,
    isPinned: false,
    typeId: "type_snippet",
    collectionIds: ["col_python", "col_interview"],
    tags: ["python", "decorators"],
    createdAt: "2024-01-08",
    updatedAt: "2024-01-08",
  },
  {
    id: "item_git_reset",
    title: "git reset --hard HEAD~1",
    contentType: "TEXT",
    description: "Undo the last commit and discard changes",
    content: "git reset --hard HEAD~1",
    isFavorite: false,
    isPinned: false,
    typeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git"],
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },
  {
    id: "item_code_review_prompt",
    title: "Code review prompt",
    contentType: "TEXT",
    description: "Detailed code review prompt for AI assistants",
    content: "Review the following code for bugs, performance, and readability...",
    isFavorite: true,
    isPinned: false,
    typeId: "type_prompt",
    collectionIds: ["col_ai_prompts"],
    tags: ["ai", "review"],
    createdAt: "2024-01-03",
    updatedAt: "2024-01-03",
  },
  {
    id: "item_ctx_system",
    title: "Next.js Project Context",
    contentType: "TEXT",
    description: "System context for Next.js 16 projects",
    content: "You are working in a Next.js 16 project with React 19...",
    isFavorite: false,
    isPinned: false,
    typeId: "type_note",
    collectionIds: ["col_context"],
    tags: ["ai", "context", "nextjs"],
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
  },
];

export const itemTypeCounts: Record<string, number> = {
  type_snippet: 24,
  type_prompt: 18,
  type_command: 15,
  type_note: 12,
  type_file: 5,
  type_image: 3,
  type_link: 8,
};

export const collectionItemCounts: Record<string, number> = {
  col_react: 12,
  col_python: 8,
  col_context: 5,
  col_interview: 24,
  col_git: 15,
  col_ai_prompts: 18,
};
