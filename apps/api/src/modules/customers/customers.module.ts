import { Module } from "@nestjs/common";
import { AccountController } from "./account.controller";
import { CustomersAdminController } from "./customers-admin.controller";

@Module({
  controllers: [CustomersAdminController, AccountController]
})
export class CustomersModule {}
