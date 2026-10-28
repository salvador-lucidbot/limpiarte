"use client";

import { useRef, useState } from "react";
import { useAdminUpload } from "../../lib/admin/use-admin-api";
import { ImageIcon, Upload, X } from "lucide-react";
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
      <Button type="button" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
        <Upload size={16} aria-hidden="true" />
        {uploading ? "Subiendo…" : label}
      </Button>
      {error && <p role="alert" className="mt-1 max-w-[14rem] text-xs text-danger-700 wrap-break-word">{error}</p>}
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
      <span className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </span>
      <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-50 text-ink-400">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <input
            required={required}
            value={value}
            aria-label={label}
            placeholder="Sube un archivo o pega una URL"
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
          {hint && <p className="mt-1.5 text-xs text-ink-500 wrap-break-word">{hint}</p>}
        </div>
        <ImageUploadButton
          onUploaded={(urls) => {
            const first = urls[0];
            if (first) onChange(first);
          }}
        />
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label={`Quitar ${label.toLocaleLowerCase("es")}`}>
            <X size={16} aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
