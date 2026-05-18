'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 400;
const DEVSTASH_THEME = 'devstash-dark';

interface CodeEditorProps {
  value: string;
  language?: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
}

export function CodeEditor({
  value,
  language,
  readOnly = false,
  onChange,
  ariaLabel,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [height, setHeight] = useState<number>(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);

  const resolvedLanguage = normalizeLanguage(language);

  const updateHeight = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const contentHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, ed.getContentHeight()));
    setHeight(contentHeight);
  }, []);

  const handleMount: OnMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    defineDevstashTheme(monacoInstance);
    monacoInstance.editor.setTheme(DEVSTASH_THEME);
    editorInstance.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  useEffect(() => {
    updateHeight();
  }, [value, updateHeight]);

  const handleCopy = async () => {
    if (!value) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="rounded-md border border-border bg-[#1e1e1e] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#161616]">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
        </div>
        <div className="flex items-center gap-2">
          {resolvedLanguage && (
            <span className="text-[10px] font-mono uppercase tracking-wide text-white/50">
              {resolvedLanguage}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            className="inline-flex items-center justify-center size-6 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
      <div
        className="code-editor-scrollbar"
        style={{ height }}
        aria-label={ariaLabel}
      >
        <Editor
          value={value}
          language={resolvedLanguage ?? 'plaintext'}
          onChange={(next) => onChange?.(next ?? '')}
          onMount={handleMount}
          theme={DEVSTASH_THEME}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 13,
            lineNumbers: 'on',
            folding: false,
            renderLineHighlight: readOnly ? 'none' : 'line',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              useShadows: false,
            },
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            tabSize: 2,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-xs text-white/40">
              Loading editor…
            </div>
          }
        />
      </div>
    </div>
  );
}

function defineDevstashTheme(monacoInstance: Monaco) {
  monacoInstance.editor.defineTheme(DEVSTASH_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#e5e5e5',
      'editor.lineHighlightBackground': '#ffffff08',
      'editorLineNumber.foreground': '#5a5a5a',
      'editorLineNumber.activeForeground': '#a0a0a0',
      'editorCursor.foreground': '#e5e5e5',
      'editor.selectionBackground': '#3b82f640',
      'editor.inactiveSelectionBackground': '#3b82f620',
      'scrollbarSlider.background': '#ffffff14',
      'scrollbarSlider.hoverBackground': '#ffffff24',
      'scrollbarSlider.activeBackground': '#ffffff34',
      'editorWidget.background': '#1e1e1e',
      'editorWidget.border': '#ffffff10',
    },
  });
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  py: 'python',
  rb: 'ruby',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  yml: 'yaml',
  md: 'markdown',
};

function normalizeLanguage(language: string | null | undefined): string | null {
  if (!language) return null;
  const trimmed = language.trim().toLowerCase();
  if (!trimmed) return null;
  return LANGUAGE_ALIASES[trimmed] ?? trimmed;
}
