import { Module } from "@nestjs/common";
import { ContentPublicController } from "./content-public.controller";
import { MarketingAdminController } from "./marketing-admin.controller";

@Module({
  controllers: [MarketingAdminController, ContentPublicController]
})
export class MarketingModule {}
