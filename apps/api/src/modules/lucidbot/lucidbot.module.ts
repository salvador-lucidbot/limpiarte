import { Global, Module } from "@nestjs/common";
import { LucidBotController } from "./lucidbot.controller";
import { LucidBotService } from "./lucidbot.service";

@Global()
@Module({
  controllers: [LucidBotController],
  providers: [LucidBotService],
  exports: [LucidBotService]
})
export class LucidBotModule {}
