import { Controller, Delete, Param, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { RequireAnyPermission } from "../../common/decorators/permissions.decorator";
import { MAX_UPLOAD_BYTES, StoredImage, UploadedImageFile, UploadStorageService } from "./upload-storage.service";

@Controller("admin/uploads")
@RequireAnyPermission("catalog.manage", "content.manage")
export class UploadsController {
  constructor(private readonly uploadStorageService: UploadStorageService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  async upload(@UploadedFile() file: UploadedImageFile, @Req() request: Request): Promise<StoredImage> {
    const requestBaseUrl = `${request.protocol}://${request.get("host") ?? "localhost"}`;
    return this.uploadStorageService.saveImage(file, requestBaseUrl);
  }

  @Delete(":fileName")
  async remove(@Param("fileName") fileName: string): Promise<{ deleted: boolean }> {
    const deleted = await this.uploadStorageService.removeImage(fileName);
    return { deleted };
  }
}
