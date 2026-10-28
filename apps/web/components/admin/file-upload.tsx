"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../../lib/api/client";
import { UPLOAD_RULES } from "../../lib/api/types";
import type { UploadedFileResult, UploadKind } from "../../lib/api/types";
import { useAdminAuth } from "../../lib/auth/admin-auth-context";
import { IconUpload, IconX } from "../icons";
import { formatFileSize } from "./list-editing";
import { Button } from "./ui";

interface UploadFormat {
  mimeTypes: string[];
  extensions: string[] | null;
  label: string;
}

const UPLOAD_FORMATS: Record<UploadKind, UploadFormat> = {
  image: { mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"], extensions: null, label: "JPG, PNG, WebP o AVIF" },
  document: { mimeTypes: ["application/pdf"], extensions: [".pdf"], label: "PDF" },
  video: { mimeTypes: ["video/mp4"], extensions: [".mp4"], label: "MP4" }
};

export class UploadCancelledError extends Error {
  constructor() {
    super("Subida cancelada");
  }
}

export interface UploadOptions {
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
}

export type AdminFileUploader = (file: File, kind: UploadKind, options?: UploadOptions) => Promise<UploadedFileResult>;

export function uploadValidationError(file: File, kind: UploadKind): string | null {
  const format = UPLOAD_FORMATS[kind];
  const rule = UPLOAD_RULES[kind];
  const lowerName = file.name.toLowerCase();
  if (!format.mimeTypes.includes(file.type)) return `«${file.name}» no es un formato permitido: usa ${format.label}.`;
  if (format.extensions && !format.extensions.some((extension) => lowerName.endsWith(extension))) {
    return `«${file.name}» debe tener extensión ${format.extensions.join(" o ")}.`;
  }
  if (file.size > rule.maxBytes) {
    return `«${file.name}» pesa ${formatFileSize(file.size)} y el máximo es ${formatFileSize(rule.maxBytes)}.`;
  }
  return null;
}

function isUploadedFileResult(value: unknown): value is UploadedFileResult {
  if (typeof value !== "object" || value === null) return false;
  if (!("url" in value) || typeof value.url !== "string") return false;
  if (!("fileName" in value) || typeof value.fileName !== "string") return false;
  return "size" in value && typeof value.size === "number";
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function serverMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("message" in body)) return null;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((part): part is string => typeof part === "string").join(", ");
  return null;
}

function uploadErrorMessage(status: number, responseText: string, kind: UploadKind): string {
  if (status === 413) return `El archivo supera el máximo de ${formatFileSize(UPLOAD_RULES[kind].maxBytes)}.`;
  if (status === 401) return "Tu sesión expiró: vuelve a iniciar sesión.";
  return serverMessage(parseJson(responseText)) ?? `No se pudo subir el archivo (error ${status}).`;
}

export function useAdminFileUpload(): AdminFileUploader {
  const { token } = useAdminAuth();

  return useCallback(
    (file: File, kind: UploadKind, options: UploadOptions = {}): Promise<UploadedFileResult> =>
      new Promise<UploadedFileResult>((resolve, reject) => {
        if (options.signal?.aborted) {
          reject(new UploadCancelledError());
          return;
        }

        const request = new XMLHttpRequest();
        request.open("POST", `${API_URL}${UPLOAD_RULES[kind].endpoint}`);
        if (token) request.setRequestHeader("authorization", `Bearer ${token}`);

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total === 0) return;
          options.onProgress?.(event.loaded / event.total);
        };
        request.onload = () => {
          if (request.status < 200 || request.status >= 300) {
            reject(new Error(uploadErrorMessage(request.status, request.responseText, kind)));
            return;
          }
          const body = parseJson(request.responseText);
          if (!isUploadedFileResult(body)) {
            reject(new Error("El servidor respondió sin la URL del archivo."));
            return;
          }
          resolve(body);
        };
        request.onerror = () => reject(new Error("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."));
        request.ontimeout = () => reject(new Error("La subida tardó demasiado. Inténtalo de nuevo."));
        request.onabort = () => reject(new UploadCancelledError());
        options.signal?.addEventListener("abort", () => request.abort(), { once: true });

        const payload = new FormData();
        payload.append("file", file);
        request.send(payload);
      }),
    [token]
  );
}

interface UploadProgress {
  fileName: string;
  ratio: number;
  position: number;
  total: number;
}

const MILESTONE_STEP = 25;

function progressMilestone(percent: number): number {
  if (percent >= 100) return 100;
  return Math.floor(percent / MILESTONE_STEP) * MILESTONE_STEP;
}

function milestoneMessage(progress: UploadProgress, milestone: number): string {
  const prefix = progress.total > 1 ? `Archivo ${progress.position} de ${progress.total}, ` : "";
  if (milestone >= 100) return `${prefix}verificando «${progress.fileName}» en el servidor…`;
  if (milestone === 0) return `${prefix}subiendo «${progress.fileName}»…`;
  return `${prefix}${milestone} % subido`;
}

function focusIsWithin(container: HTMLElement | null): boolean {
  const active = document.activeElement;
  if (!active || active === document.body) return true;
  return container?.contains(active) ?? false;
}

interface FileUploadButtonProps {
  kind: UploadKind;
  label: string;
  onUploaded: (result: UploadedFileResult, file: File) => void;
  onBusyChange?: (busy: boolean) => void;
  multiple?: boolean;
  disabled?: boolean;
  maxFiles?: number;
}

export function FileUploadButton({
  kind,
  label,
  onUploaded,
  onBusyChange,
  multiple = false,
  disabled = false,
  maxFiles
}: FileUploadButtonProps): React.ReactNode {
  const upload = useAdminFileUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const wasUploading = useRef(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);
  const uploading = progress !== null;

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    const previously = wasUploading.current;
    wasUploading.current = uploading;
    if (previously === uploading) return;
    if (!focusIsWithin(containerRef.current)) return;
    if (uploading) {
      cancelRef.current?.focus();
      return;
    }
    triggerRef.current?.focus();
  }, [uploading]);

  async function handleFiles(list: FileList | null): Promise<void> {
    const selected = list ? Array.from(list) : [];
    if (inputRef.current) inputRef.current.value = "";
    if (selected.length === 0) return;

    const files = maxFiles === undefined ? selected : selected.slice(0, Math.max(0, maxFiles));
    if (files.length === 0) {
      setError("Ya alcanzaste el máximo de archivos para esta sección.");
      return;
    }
    const rejected = files.map((file) => uploadValidationError(file, kind)).find((message): message is string => message !== null);
    if (rejected) {
      setError(rejected);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setError(files.length < selected.length ? `Solo se subirán ${files.length} archivo(s) para no superar el máximo.` : null);
    setCompletedMessage(null);
    onBusyChange?.(true);
    try {
      for (const [index, file] of files.entries()) {
        setProgress({ fileName: file.name, ratio: 0, position: index + 1, total: files.length });
        const result = await upload(file, kind, {
          signal: controller.signal,
          onProgress: (ratio) => setProgress({ fileName: file.name, ratio, position: index + 1, total: files.length })
        });
        onUploaded(result, file);
      }
      setCompletedMessage(files.length === 1 ? "El archivo se subió correctamente." : `Se subieron ${files.length} archivos correctamente.`);
    } catch (uploadError) {
      if (!(uploadError instanceof UploadCancelledError)) {
        setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo.");
      }
    } finally {
      controllerRef.current = null;
      setProgress(null);
      onBusyChange?.(false);
    }
  }

  const percent = progress ? Math.round(progress.ratio * 100) : 0;
  const liveMessage = progress ? milestoneMessage(progress, progressMilestone(percent)) : (completedMessage ?? "");

  return (
    <div ref={containerRef} className="min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_RULES[kind].accept}
        multiple={multiple}
        onChange={(event) => void handleFiles(event.target.files)}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      {!progress && (
        <Button ref={triggerRef} type="button" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <IconUpload size={15} />
          {label}
        </Button>
      )}
      {progress && (
        <div className="w-72 max-w-full rounded-xl border border-brand-100 bg-brand-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium text-navy-900" title={progress.fileName}>
              {progress.total > 1 ? `${progress.position} de ${progress.total} · ` : ""}
              {progress.fileName}
            </p>
            <button
              ref={cancelRef}
              type="button"
              onClick={() => controllerRef.current?.abort()}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-stone-500 hover:bg-white hover:text-red-600"
            >
              <IconX size={12} />
              Cancelar<span className="sr-only"> la subida de {progress.fileName}</span>
            </button>
          </div>
          <div
            role="progressbar"
            aria-label={`Subiendo ${progress.fileName}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-white"
          >
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-stone-500" aria-hidden="true">
            {percent >= 100 ? "Verificando el archivo en el servidor…" : `Subiendo… ${percent} %`}
          </p>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
      {error && (
        <p role="alert" className="mt-1 max-w-xs text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
