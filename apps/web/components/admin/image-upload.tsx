"use client";

import { useRef, useState } from "react";
import { useAdminUpload } from "../../lib/admin/use-admin-api";
import { IconImage, IconUpload, IconX } from "../icons";
import { Button, inputClass } from "./ui";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif";
const ACCEPTED_TYPE_LIST = ACCEPTED_TYPES.split(",");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function validationError(file: File): string | null {
  if (!ACCEPTED_TYPE_LIST.includes(file.type)) return `«${file.name}» no es un formato permitido: usa JPG, PNG, WebP o AVIF.`;
  if (file.size > MAX_UPLOAD_BYTES) return `«${file.name}» pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB.`;
  return null;
}

interface ImageUploadButtonProps {
  onUploaded: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
}

export function ImageUploadButton({ onUploaded, label = "Subir", multiple = false }: ImageUploadButtonProps): React.ReactNode {
  const upload = useAdminUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;

    const selected = Array.from(files);
    const rejected = selected.map(validationError).filter((message): message is string => message !== null);
    if (rejected.length > 0) {
      setError(rejected[0] ?? null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError(null);
    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        const result = await upload(file);
        uploaded.push(result.url);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }

    if (uploaded.length > 0) onUploaded(uploaded);
  }

  return (
    <div className="shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={multiple}
        onChange={(event) => void handleFiles(event.target.files)}
        className="hidden"
      />
      <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <span className="flex items-center gap-1.5">
          <IconUpload size={15} />
          {uploading ? "Subiendo…" : label}
        </span>
      </Button>
      {error && <p className="mt-1 max-w-[14rem] text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface ImageUrlFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
}

export function ImageUrlField({ label, value, onChange, required = false, hint }: ImageUrlFieldProps): React.ReactNode {
  return (
    <div className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required && " *"}
      </span>
      <div className="flex items-start gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50 text-stone-300">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <IconImage size={18} />}
        </span>
        <div className="flex-1">
          <input
            required={required}
            value={value}
            placeholder="Sube un archivo o pega una URL"
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
          {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
        </div>
        <ImageUploadButton
          onUploaded={(urls) => {
            const first = urls[0];
            if (first) onChange(first);
          }}
        />
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange("")} aria-label="Quitar imagen">
            <IconX size={15} />
          </Button>
        )}
      </div>
    </div>
  );
}
