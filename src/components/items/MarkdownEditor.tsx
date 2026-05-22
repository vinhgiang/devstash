'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 400;

type Tab = 'write' | 'preview';

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  ariaLabel,
  placeholder = 'Write Markdown…',
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? 'preview' : 'write');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showWrite = !readOnly && tab === 'write';

  useEffect(() => {
    if (!showWrite) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value, showWrite]);

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
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 bg-[#2d2d2d]">
        <div className="flex items-center gap-0.5">
          {!readOnly && (
            <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
              Write
            </TabButton>
          )}
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            Preview
          </TabButton>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy Markdown"
          className="inline-flex items-center justify-center size-6 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {showWrite ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          spellCheck={false}
          className="w-full resize-none bg-[#1e1e1e] px-3 py-2 text-sm font-mono text-[#e5e5e5] outline-none placeholder:text-white/30 overflow-y-auto"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
      ) : (
        <div
          className="markdown-preview overflow-y-auto px-4 py-3"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          aria-label={ariaLabel}
        >
          {value.trim() ? (
            <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
          ) : (
            <p className="text-sm text-white/30">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}
