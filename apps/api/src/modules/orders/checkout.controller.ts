import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Customer } from "../../generated/prisma/client";
import { CheckoutDto } from "./dto/checkout.dto";
import { CheckoutResult, OrdersService } from "./orders.service";

@Public()
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  checkout(@Body() dto: CheckoutDto, @CurrentCustomer() customer: Customer | undefined): Promise<CheckoutResult> {
    return this.ordersService.checkout(dto, customer?.id ?? null);
  }
}
