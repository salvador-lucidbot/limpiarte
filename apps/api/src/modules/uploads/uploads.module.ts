import { Module } from "@nestjs/common";
import { UploadReferencesService } from "./upload-references.service";
import { UploadStorageService } from "./upload-storage.service";
import { UploadsController } from "./uploads.controller";

@Module({
  controllers: [UploadsController],
  providers: [UploadStorageService, UploadReferencesService],
  exports: [UploadStorageService]
})
export class UploadsModule {}
