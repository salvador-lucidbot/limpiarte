import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { AuthGuard } from "./common/guards/auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { SecurityModule } from "./common/security/security.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CartModule } from "./modules/cart/cart.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { ContactModule } from "./modules/contact/contact.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { LucidBotModule } from "./modules/lucidbot/lucidbot.module";
import { MailModule } from "./modules/mail/mail.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MailModule,
    AuditModule,
    LucidBotModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CatalogModule,
    InventoryModule,
    ShippingModule,
    CouponsModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    CustomersModule,
    MarketingModule,
    ReportsModule,
    SettingsModule,
    ContactModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter }
  ]
})
export class AppModule {}
