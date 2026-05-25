'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ICON_COMPONENTS, ITEM_TYPE_COLORS } from '@/lib/constants/item-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from '@/components/items/CodeEditor';
import { MarkdownEditor } from '@/components/items/MarkdownEditor';
import { FileUpload, type UploadedFile } from '@/components/items/FileUpload';
import {
  CollectionsMultiSelect,
  type CollectionOption,
} from '@/components/items/CollectionsMultiSelect';
import { createItem } from '@/actions/items';

export type NewItemTypeSlug =
  | 'snippet'
  | 'prompt'
  | 'command'
  | 'note'
  | 'link'
  | 'file'
  | 'image';

interface NewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: NewItemTypeSlug;
}

type TypeSlug = NewItemTypeSlug;

const TYPE_OPTIONS: { slug: TypeSlug; label: string; icon: keyof typeof ICON_COMPONENTS }[] = [
  { slug: 'snippet', label: 'Snippet', icon: 'Code' },
  { slug: 'prompt', label: 'Prompt', icon: 'Sparkles' },
  { slug: 'command', label: 'Command', icon: 'Terminal' },
  { slug: 'note', label: 'Note', icon: 'StickyNote' },
  { slug: 'link', label: 'Link', icon: 'Link' },
  { slug: 'file', label: 'File', icon: 'File' },
  { slug: 'image', label: 'Image', icon: 'Image' },
];

const TYPES_WITH_CONTENT = new Set<TypeSlug>(['snippet', 'prompt', 'command', 'note']);
const TYPES_WITH_LANGUAGE = new Set<TypeSlug>(['snippet', 'command']);
const TYPES_WITH_CODE_EDITOR = new Set<TypeSlug>(['snippet', 'command']);
const TYPES_WITH_FILE = new Set<TypeSlug>(['file', 'image']);

interface FormState {
  typeSlug: TypeSlug;
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  file: UploadedFile | null;
  tags: string[];
  collectionIds: string[];
}

const buildInitialState = (typeSlug: TypeSlug): FormState => ({
  typeSlug,
  title: '',
  description: '',
  content: '',
  url: '',
  language: '',
  file: null,
  tags: [],
  collectionIds: [],
});

export function NewItemDialog({ open, onOpenChange, initialType }: NewItemDialogProps) {
  const router = useRouter();
  const defaultType: TypeSlug = initialType ?? 'snippet';
  const [form, setForm] = useState<FormState>(() => buildInitialState(defaultType));
  const [saving, setSaving] = useState(false);
  const [collectionOptions, setCollectionOptions] = useState<CollectionOption[]>([]);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(defaultType));
      setSaving(false);
    } else {
      setSaving(false);
    }
  }, [open, defaultType]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/collections/options')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: CollectionOption[]) => {
        if (!cancelled) setCollectionOptions(data);
      })
      .catch(() => {
        if (!cancelled) setCollectionOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const showContent = TYPES_WITH_CONTENT.has(form.typeSlug);
  const showLanguage = TYPES_WITH_LANGUAGE.has(form.typeSlug);
  const showUrl = form.typeSlug === 'link';
  const showFile = TYPES_WITH_FILE.has(form.typeSlug);
  const titleEmpty = form.title.trim().length === 0;
  const urlEmpty = showUrl && form.url.trim().length === 0;
  const fileMissing = showFile && form.file === null;
  const submitDisabled = titleEmpty || urlEmpty || fileMissing || saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    setSaving(true);
    const result = await createItem({
      typeSlug: form.typeSlug,
      title: form.title,
      description: form.description,
      content: showContent ? form.content : null,
      url: showUrl ? form.url : null,
      language: showLanguage ? form.language : null,
      fileKey: showFile ? (form.file?.key ?? null) : null,
      fileName: showFile ? (form.file?.fileName ?? null) : null,
      fileSize: showFile ? (form.file?.fileSize ?? null) : null,
      tags: form.tags,
      collectionIds: form.collectionIds,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Item created');
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
          <DialogDescription>
            Save a snippet, prompt, command, note, link, file, or image to your hub.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field htmlFor="new-item-type" label="Type">
            <Select
              value={form.typeSlug}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, typeSlug: value as TypeSlug }))
              }
            >
              <SelectTrigger id="new-item-type" className="w-full">
                <SelectValue>
                  {(value: string) => {
                    const opt = TYPE_OPTIONS.find((o) => o.slug === value);
                    if (!opt) return null;
                    const Icon = ICON_COMPONENTS[opt.icon];
                    return (
                      <>
                        <Icon
                          className="size-4"
                          style={{ color: ITEM_TYPE_COLORS[opt.slug] }}
                        />
                        <span>{opt.label}</span>
                      </>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = ICON_COMPONENTS[opt.icon];
                  return (
                    <SelectItem key={opt.slug} value={opt.slug}>
                      <Icon
                        className="size-4"
                        style={{ color: ITEM_TYPE_COLORS[opt.slug] }}
                      />
                      <span>{opt.label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor="new-item-title" label="Title">
            <Input
              id="new-item-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="A short, descriptive name"
              autoFocus
            />
          </Field>

          {showUrl && (
            <Field htmlFor="new-item-url" label="URL">
              <Input
                id="new-item-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
              />
            </Field>
          )}

          {showFile && (
            <Field htmlFor="new-item-file" label={form.typeSlug === 'image' ? 'Image' : 'File'}>
              <FileUpload
                category={form.typeSlug === 'image' ? 'image' : 'file'}
                value={form.file}
                onChange={(file) => setForm((f) => ({ ...f, file }))}
                disabled={saving}
              />
            </Field>
          )}

          <Field htmlFor="new-item-description" label="Description">
            <Textarea
              id="new-item-description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          {showContent && (
            <Field htmlFor="new-item-content" label="Content">
              {TYPES_WITH_CODE_EDITOR.has(form.typeSlug) ? (
                <CodeEditor
                  value={form.content}
                  language={form.language}
                  onChange={(content) => setForm((f) => ({ ...f, content }))}
                  ariaLabel="Code content"
                />
              ) : (
                <MarkdownEditor
                  value={form.content}
                  onChange={(content) => setForm((f) => ({ ...f, content }))}
                  ariaLabel="Markdown content"
                />
              )}
            </Field>
          )}

          {showLanguage && (
            <Field htmlFor="new-item-language" label="Language">
              <Input
                id="new-item-language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="e.g. typescript"
              />
            </Field>
          )}

          <Field htmlFor="new-item-tags" label="Tags">
            <TagsInput
              id="new-item-tags"
              tags={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </Field>

          <Field htmlFor="new-item-collections" label="Collections">
            <CollectionsMultiSelect
              options={collectionOptions}
              value={form.collectionIds}
              onChange={(collectionIds) => setForm((f) => ({ ...f, collectionIds }))}
              disabled={saving}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TagsInput({
  id,
  tags,
  onChange,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (tags.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
      return;
    }
    if (e.key === 'Backspace' && draft.length === 0 && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      commit(value.slice(0, -1));
      return;
    }
    setDraft(value);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={tags.length === 0 ? 'Add tags…' : ''}
        className="flex-1 min-w-[6rem] bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
