import { ConflictException, Controller, Delete, ForbiddenException, Param, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { RequireAnyPermission, RequirePermissions } from "../../common/decorators/permissions.decorator";
import type { AuthenticatedRequest } from "../../common/types/request-context";
import { UploadReferencesService } from "./upload-references.service";
import {
  MAX_DOCUMENT_BYTES,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_BYTES,
  resolveIncomingDirectory,
  uploadFileFilter,
  UploadStorageService
} from "./upload-storage.service";
import type { StoredUpload, UploadedDiskFile, UploadedImageFile } from "./upload-storage.service";

const CATALOG_PERMISSION = "catalog.manage";
const CATALOG_ONLY_FILE = /\.(pdf|mp4)$/i;

function requestBaseUrl(request: Request): string {
  return `${request.protocol}://${request.get("host") ?? "localhost"}`;
}

@Controller("admin/uploads")
@RequireAnyPermission("catalog.manage", "content.manage")
export class UploadsController {
  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly uploadReferencesService: UploadReferencesService
  ) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  upload(@UploadedFile() file: UploadedImageFile, @Req() request: Request): Promise<StoredUpload> {
    return this.uploadStorageService.saveImage(file, requestBaseUrl(request));
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermissions(CATALOG_PERMISSION)
  @Post("documents")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
      fileFilter: uploadFileFilter("document")
    })
  )
  uploadDocument(@UploadedFile() file: UploadedImageFile, @Req() request: Request): Promise<StoredUpload> {
    return this.uploadStorageService.saveDocument(file, requestBaseUrl(request));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequirePermissions(CATALOG_PERMISSION)
  @Post("videos")
  @UseInterceptors(
    FileInterceptor("file", {
      dest: resolveIncomingDirectory(),
      limits: { fileSize: MAX_VIDEO_BYTES, files: 1 },
      fileFilter: uploadFileFilter("video")
    })
  )
  uploadVideo(@UploadedFile() file: UploadedDiskFile | undefined, @Req() request: Request): Promise<StoredUpload> {
    return this.uploadStorageService.saveVideo(file, requestBaseUrl(request));
  }

  @Delete(":fileName")
  async remove(@Param("fileName") fileName: string, @Req() request: AuthenticatedRequest): Promise<{ deleted: boolean }> {
    const staff = request.staff;
    const catalogOnly = CATALOG_ONLY_FILE.test(fileName);
    if (catalogOnly && staff && !staff.user.isSuperadmin && !staff.permissions.has(CATALOG_PERMISSION)) {
      throw new ForbiddenException("Permisos insuficientes");
    }
    if (await this.uploadReferencesService.isReferenced(fileName)) {
      throw new ConflictException("El archivo está en uso en el catálogo o en el contenido: quítalo de allí antes de borrarlo.");
    }
    const deleted = await this.uploadStorageService.removeFile(fileName);
    return { deleted };
  }
}
