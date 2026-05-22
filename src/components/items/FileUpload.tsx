'use client';

import { useEffect, useRef, useState } from 'react';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  acceptAttribute,
  formatBytes,
  maxSizeLabel,
  validateUpload,
  type UploadCategory,
} from '@/lib/constants/file-upload';

export interface UploadedFile {
  key: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  category: UploadCategory;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  disabled?: boolean;
}

export function FileUpload({ category, value, onChange, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => xhrRef.current?.abort();
  }, []);

  const handleFile = (file: File) => {
    const validation = validateUpload({
      category,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setPreviewUrl(category === 'image' ? URL.createObjectURL(file) : null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      xhrRef.current = null;
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadedFile;
          onChange(data);
        } catch {
          toast.error('Upload failed. Please try again.');
          setPreviewUrl(null);
        }
        return;
      }
      let message = 'Upload failed. Please try again.';
      try {
        message = (JSON.parse(xhr.responseText) as { error?: string }).error ?? message;
      } catch {
        // keep default message
      }
      toast.error(message);
      setPreviewUrl(null);
    });

    xhr.addEventListener('error', () => {
      xhrRef.current = null;
      setUploading(false);
      setPreviewUrl(null);
      toast.error('Upload failed. Please try again.');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const handleRemove = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploading(false);
    setProgress(0);
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={acceptAttribute(category)}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
      }}
    />
  );

  if (value || uploading) {
    return (
      <div className="rounded-md border border-input bg-input/30 p-3">
        {hiddenInput}
        <div className="flex items-center gap-3">
          {category === 'image' && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={value?.fileName ?? 'Upload preview'}
              className="size-14 rounded object-cover shrink-0"
            />
          ) : (
            <div className="size-14 rounded bg-muted flex items-center justify-center shrink-0">
              <FileIcon className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {value?.fileName ?? 'Uploading…'}
            </p>
            {value && (
              <p className="text-xs text-muted-foreground">{formatBytes(value.fileSize)}</p>
            )}
            {uploading && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {progress}%
                </span>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {hiddenInput}
      <button
        type="button"
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={disabled}
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-8 text-center transition-colors disabled:pointer-events-none disabled:opacity-50 ${
          dragOver
            ? 'border-ring bg-muted/50'
            : 'border-input hover:border-ring hover:bg-muted/30'
        }`}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium">
          Drag &amp; drop or <span className="text-primary">browse</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {category === 'image' ? 'Images' : 'Files'} up to {maxSizeLabel(category)}
        </span>
      </button>
    </div>
  );
}
