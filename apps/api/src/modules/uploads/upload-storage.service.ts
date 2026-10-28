import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { copyFile, mkdir, open, readdir, rename, stat, unlink, writeFile } from "fs/promises";
import { homedir } from "os";
import { extname, isAbsolute, join, resolve } from "path";

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedDiskFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export type UploadKind = "image" | "document" | "video";

export interface StoredUpload {
  fileName: string;
  url: string;
  size: number;
  mimeType: string;
  kind: UploadKind;
}

interface IncomingFileHeader {
  originalname: string;
  mimetype: string;
}

type UploadFilterCallback = (error: Error | null, acceptFile: boolean) => void;

interface UploadPolicy {
  maxBytes: number;
  extensionByMime: Record<string, string>;
  requiredOriginalExtension: string | null;
  formatMessage: string;
  tooLargeMessage: string;
  invalidContentMessage: string;
  matchesSignature: (head: Buffer, mimeType: string) => boolean;
}

const MEGABYTE = 1024 * 1024;

export const MAX_UPLOAD_BYTES = 5 * MEGABYTE;
export const MAX_DOCUMENT_BYTES = 10 * MEGABYTE;
export const MAX_VIDEO_BYTES = 50 * MEGABYTE;

const SIGNATURE_BYTES = 64;

const SEEDABLE_FILE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|avif|mp4)$/;
const REMOVABLE_FILE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|avif|pdf|mp4)$/;

const NON_VIDEO_ISO_BRANDS = new Set([
  "avif",
  "avis",
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
  "crx ",
  "jp2 ",
  "jpx ",
  "jpm ",
  "M4A ",
  "M4B ",
  "M4P ",
  "F4A ",
  "F4B ",
  "qt  "
]);

function matchesImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") {
    return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (mimeType === "image/avif") {
    return buffer.length > 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp" && buffer.subarray(8, 12).toString("ascii").startsWith("av");
  }
  return false;
}

function matchesPdfSignature(head: Buffer): boolean {
  return head.length >= 5 && head.subarray(0, 5).toString("latin1") === "%PDF-";
}

function matchesMp4Signature(head: Buffer): boolean {
  if (head.length < 12) return false;
  if (head.subarray(4, 8).toString("latin1") !== "ftyp") return false;
  return !NON_VIDEO_ISO_BRANDS.has(head.subarray(8, 12).toString("latin1"));
}

const UPLOAD_POLICIES: Record<UploadKind, UploadPolicy> = {
  image: {
    maxBytes: MAX_UPLOAD_BYTES,
    extensionByMime: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" },
    requiredOriginalExtension: null,
    formatMessage: "Formato no permitido: usa JPG, PNG, WebP o AVIF",
    tooLargeMessage: "La imagen supera el máximo de 5 MB",
    invalidContentMessage: "El contenido del archivo no corresponde a una imagen válida",
    matchesSignature: matchesImageSignature
  },
  document: {
    maxBytes: MAX_DOCUMENT_BYTES,
    extensionByMime: { "application/pdf": "pdf" },
    requiredOriginalExtension: ".pdf",
    formatMessage: "Formato no permitido: solo se aceptan documentos PDF",
    tooLargeMessage: "El documento supera el máximo de 10 MB",
    invalidContentMessage: "El contenido del archivo no corresponde a un PDF válido",
    matchesSignature: matchesPdfSignature
  },
  video: {
    maxBytes: MAX_VIDEO_BYTES,
    extensionByMime: { "video/mp4": "mp4" },
    requiredOriginalExtension: ".mp4",
    formatMessage: "Formato no permitido: solo se aceptan videos MP4",
    tooLargeMessage: "El video supera el máximo de 50 MB",
    invalidContentMessage: "El archivo no es un video MP4 válido: expórtalo como MP4 (H.264)",
    matchesSignature: matchesMp4Signature
  }
};

const PERSISTENT_DIRECTORY_NAME = "limpiarte-uploads";

function configuredUploadsDirectory(): string | null {
  const configured = process.env.UPLOADS_DIR;
  if (!configured || configured.length === 0) return null;
  return isAbsolute(configured) ? resolve(configured) : resolve(process.cwd(), configured);
}

function toPosix(value: string): string {
  return value.split("\\").join("/");
}

/// Rutas que el hosting reemplaza en cada despliegue: el directorio versionado del
/// build y la raíz pública del sitio. Un archivo subido ahí se pierde al desplegar.
function isReplacedOnDeploy(directory: string): boolean {
  const normalized = toPosix(directory);
  if (normalized.includes("/hbuilds/")) return true;
  if (normalized.includes("/public_html/")) return true;
  return normalized.startsWith(`${toPosix(process.cwd())}/`);
}

export function persistentUploadsDirectory(): string {
  return join(homedir(), PERSISTENT_DIRECTORY_NAME);
}

export function resolveUploadsDirectory(): string {
  const configured = configuredUploadsDirectory();
  if (process.env.NODE_ENV !== "production") return configured ?? resolve(process.cwd(), "uploads");
  if (configured && !isReplacedOnDeploy(configured)) return configured;
  return persistentUploadsDirectory();
}

/// Directorio del que hay que rescatar archivos la primera vez que el almacenamiento
/// se reubica: lo que el panel subió antes de este cambio vive ahí.
export function legacyUploadsDirectory(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  const configured = configuredUploadsDirectory();
  if (!configured) return null;
  if (!isReplacedOnDeploy(configured)) return null;
  if (configured === resolveUploadsDirectory()) return null;
  return configured;
}

export function resolveIncomingDirectory(): string {
  return join(resolveUploadsDirectory(), ".incoming");
}

function resolveSeedDirectory(): string {
  return resolve(__dirname, "..", "..", "uploads-seed");
}

function formatError(kind: UploadKind, file: IncomingFileHeader): string | null {
  const policy = UPLOAD_POLICIES[kind];
  if (!policy.extensionByMime[file.mimetype]) return policy.formatMessage;
  if (!policy.requiredOriginalExtension) return null;
  if (extname(file.originalname).toLowerCase() !== policy.requiredOriginalExtension) return policy.formatMessage;
  return null;
}

export function uploadFileFilter(
  kind: UploadKind
): (request: unknown, file: IncomingFileHeader, callback: UploadFilterCallback) => void {
  return (_request, file, callback) => {
    const message = formatError(kind, file);
    if (message) {
      callback(new BadRequestException(message), false);
      return;
    }
    callback(null, true);
  };
}

async function readHead(path: string): Promise<Buffer> {
  const handle = await open(path, "r");
  try {
    const head = Buffer.alloc(SIGNATURE_BYTES);
    const { bytesRead } = await handle.read(head, 0, SIGNATURE_BYTES, 0);
    return head.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function discard(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    void 0;
  }
}

@Injectable()
export class UploadStorageService implements OnModuleInit {
  private readonly logger = new Logger(UploadStorageService.name);
  readonly directory = resolveUploadsDirectory();
  private readonly incomingDirectory = resolveIncomingDirectory();

  async onModuleInit(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await mkdir(this.incomingDirectory, { recursive: true });
    this.logger.log(`Almacenamiento de archivos en ${this.directory}`);
    await this.clearIncoming();
    await this.rescueLegacyUploads();
    await this.seedBundledImages();
  }

  private async clearIncoming(): Promise<void> {
    let names: string[];
    try {
      names = await readdir(this.incomingDirectory);
    } catch {
      return;
    }
    for (const name of names) await discard(join(this.incomingDirectory, name));
  }

  /// Mueve a la ruta persistente lo que quedó en la ruta que el despliegue reemplaza.
  /// Se ejecuta en cada arranque y es idempotente: lo que ya existe no se pisa.
  private async rescueLegacyUploads(): Promise<void> {
    const legacy = legacyUploadsDirectory();
    if (!legacy) return;

    let names: string[];
    try {
      names = await readdir(legacy);
    } catch {
      return;
    }

    let rescued = 0;

    for (const name of names) {
      if (!REMOVABLE_FILE_NAME.test(name)) continue;

      const target = join(this.directory, name);
      try {
        await stat(target);
        continue;
      } catch {
        void 0;
      }

      try {
        await copyFile(join(legacy, name), target);
        rescued += 1;
      } catch (error) {
        this.logger.warn(`No se pudo rescatar ${name}: ${(error as Error).message}`);
      }
    }

    if (rescued > 0) this.logger.log(`Archivos rescatados de ${legacy}: ${rescued}`);
  }

  private async seedBundledImages(): Promise<void> {
    const seedDirectory = resolveSeedDirectory();
    if (seedDirectory === this.directory) return;

    let names: string[];
    try {
      names = await readdir(seedDirectory);
    } catch {
      return;
    }

    let copied = 0;

    for (const name of names) {
      if (!SEEDABLE_FILE_NAME.test(name)) continue;

      const target = join(this.directory, name);
      try {
        await stat(target);
        continue;
      } catch {
        void 0;
      }

      try {
        await copyFile(join(seedDirectory, name), target);
        copied += 1;
      } catch (error) {
        this.logger.warn(`No se pudo sembrar la imagen ${name}: ${(error as Error).message}`);
      }
    }

    if (copied > 0) this.logger.log(`Imágenes sembradas desde el artefacto: ${copied}`);
  }

  saveImage(file: UploadedImageFile, requestBaseUrl: string): Promise<StoredUpload> {
    return this.saveBuffer("image", file, requestBaseUrl);
  }

  saveDocument(file: UploadedImageFile, requestBaseUrl: string): Promise<StoredUpload> {
    return this.saveBuffer("document", file, requestBaseUrl);
  }

  async saveVideo(file: UploadedDiskFile | undefined, requestBaseUrl: string): Promise<StoredUpload> {
    if (!file) throw new BadRequestException("No se recibió ningún archivo");

    try {
      const policy = UPLOAD_POLICIES.video;
      const formatMessage = formatError("video", file);
      if (formatMessage) throw new BadRequestException(formatMessage);
      if (file.size > policy.maxBytes) throw new BadRequestException(policy.tooLargeMessage);

      const head = await readHead(file.path);
      if (!policy.matchesSignature(head, file.mimetype)) throw new BadRequestException(policy.invalidContentMessage);

      const fileName = `${randomUUID()}.mp4`;
      await mkdir(this.directory, { recursive: true });
      await rename(file.path, join(this.directory, fileName));

      return this.describe("video", fileName, file.size, file.mimetype, requestBaseUrl);
    } catch (error) {
      await discard(file.path);
      throw error;
    }
  }

  async removeFile(fileName: string): Promise<boolean> {
    if (!REMOVABLE_FILE_NAME.test(fileName)) throw new BadRequestException("Nombre de archivo inválido");

    try {
      await unlink(join(this.directory, fileName));
      return true;
    } catch {
      return false;
    }
  }

  private async saveBuffer(kind: UploadKind, file: UploadedImageFile | undefined, requestBaseUrl: string): Promise<StoredUpload> {
    if (!file) throw new BadRequestException("No se recibió ningún archivo");

    const policy = UPLOAD_POLICIES[kind];
    if (file.size > policy.maxBytes) throw new BadRequestException(policy.tooLargeMessage);

    const formatMessage = formatError(kind, file);
    if (formatMessage) throw new BadRequestException(formatMessage);

    const extension = policy.extensionByMime[file.mimetype];
    if (!extension) throw new BadRequestException(policy.formatMessage);
    if (!policy.matchesSignature(file.buffer, file.mimetype)) throw new BadRequestException(policy.invalidContentMessage);

    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, fileName), file.buffer);

    return this.describe(kind, fileName, file.size, file.mimetype, requestBaseUrl);
  }

  private describe(kind: UploadKind, fileName: string, size: number, mimeType: string, requestBaseUrl: string): StoredUpload {
    return {
      fileName,
      url: `${this.publicBaseUrl(requestBaseUrl)}/uploads/${fileName}`,
      size,
      mimeType,
      kind
    };
  }

  private publicBaseUrl(requestBaseUrl: string): string {
    const configured = process.env.PUBLIC_BASE_URL;
    const base = configured && configured.length > 0 ? configured : requestBaseUrl;
    return base.replace(/\/+$/, "");
  }
}
