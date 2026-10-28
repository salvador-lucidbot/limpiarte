import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { MetaAdsService } from "./meta-ads.service";

@Module({
  imports: [CatalogModule],
  controllers: [AssistantController],
  providers: [AssistantService, MetaAdsService]
})
export class AssistantModule {}
