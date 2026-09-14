import { Module } from "@nestjs/common";
import { UploadStorageService } from "./upload-storage.service";
import { UploadsController } from "./uploads.controller";

@Module({
  controllers: [UploadsController],
  providers: [UploadStorageService],
  exports: [UploadStorageService]
})
export class UploadsModule {}
