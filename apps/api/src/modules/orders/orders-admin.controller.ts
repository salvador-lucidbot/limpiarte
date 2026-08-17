import { Body, Controller, Get, Header, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { User } from "../../generated/prisma/client";
import { AddOrderNoteDto, OrderQueryDto, UpdateOrderStatusDto } from "./dto/order-admin.dto";
import { OrdersService } from "./orders.service";

@Controller("admin/orders")
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions("orders.view")
  list(@Query() query: OrderQueryDto): ReturnType<OrdersService["adminList"]> {
    return this.ordersService.adminList(query);
  }

  @Get("export")
  @RequirePermissions("reports.export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=pedidos.csv")
  export(@Query() query: OrderQueryDto): ReturnType<OrdersService["adminExportRows"]> {
    return this.ordersService.adminExportRows(query);
  }

  @Get(":id")
  @RequirePermissions("orders.view")
  detail(@Param("id") id: string): ReturnType<OrdersService["adminDetail"]> {
    return this.ordersService.adminDetail(id);
  }

  @Put(":id/status")
  @RequirePermissions("orders.manage")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() actor: User
  ): ReturnType<OrdersService["updateStatus"]> {
    return this.ordersService.updateStatus(id, dto, actor.id);
  }

  @Post(":id/notes")
  @RequirePermissions("orders.view")
  addNote(@Param("id") id: string, @Body() dto: AddOrderNoteDto, @CurrentUser() actor: User): ReturnType<OrdersService["addNote"]> {
    return this.ordersService.addNote(id, dto.note, actor.id);
  }

  @Post(":id/resend-confirmation")
  @RequirePermissions("orders.view")
  resend(@Param("id") id: string): ReturnType<OrdersService["resendConfirmation"]> {
    return this.ordersService.resendConfirmation(id);
  }
}
