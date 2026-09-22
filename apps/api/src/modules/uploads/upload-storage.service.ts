import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { copyFile, mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import { isAbsolute, join, resolve } from "path";

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredImage {
  fileName: string;
  url: string;
  size: number;
  mimeType: string;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

const SAFE_FILE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/;

export function resolveUploadsDirectory(): string {
  const configured = process.env.UPLOADS_DIR;
  if (configured && configured.length > 0) {
    return isAbsolute(configured) ? resolve(configured) : resolve(process.cwd(), configured);
  }
  return resolve(process.cwd(), "uploads");
}

/**
 * Imágenes que viajan compiladas dentro del artefacto de despliegue.
 * El build de Hostinger corre en un entorno efímero y solo promueve el directorio de salida,
 * así que los archivos del repositorio llegan aquí y hay que copiarlos al almacenamiento
 * persistente cuando arranca el proceso, que es lo único que ve el disco definitivo.
 */
function resolveSeedDirectory(): string {
  return resolve(__dirname, "..", "..", "uploads-seed");
}

function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
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

@Injectable()
export class UploadStorageService implements OnModuleInit {
  private readonly logger = new Logger(UploadStorageService.name);
  readonly directory = resolveUploadsDirectory();

  async onModuleInit(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    this.logger.log(`Almacenamiento de imágenes en ${this.directory}`);
    await this.seedBundledImages();
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
      if (!SAFE_FILE_NAME.test(name)) continue;

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

  async saveImage(file: UploadedImageFile, requestBaseUrl: string): Promise<StoredImage> {
    if (!file) throw new BadRequestException("No se recibió ningún archivo");
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException("La imagen supera el máximo de 5 MB");

    const extension = EXTENSION_BY_MIME[file.mimetype];
    if (!extension) throw new BadRequestException("Formato no permitido: usa JPG, PNG, WebP o AVIF");
    if (!matchesMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException("El contenido del archivo no corresponde a una imagen válida");
    }

    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, fileName), file.buffer);

    return {
      fileName,
      url: `${this.publicBaseUrl(requestBaseUrl)}/uploads/${fileName}`,
      size: file.size,
      mimeType: file.mimetype
    };
  }

  async removeImage(fileName: string): Promise<boolean> {
    if (!SAFE_FILE_NAME.test(fileName)) throw new BadRequestException("Nombre de archivo inválido");

    try {
      await unlink(join(this.directory, fileName));
      return true;
    } catch {
      return false;
    }
  }

  private publicBaseUrl(requestBaseUrl: string): string {
    const configured = process.env.PUBLIC_BASE_URL;
    const base = configured && configured.length > 0 ? configured : requestBaseUrl;
    return base.replace(/\/+$/, "");
  }
}
