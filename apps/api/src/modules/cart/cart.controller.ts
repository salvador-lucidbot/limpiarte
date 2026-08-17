import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Customer } from "../../generated/prisma/client";
import { CartService, CartView } from "./cart.service";
import { AddCartItemDto, ApplyCouponDto, CartEstimateDto, UpdateCartItemDto } from "./dto/cart.dto";

@Public()
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(@CurrentCustomer() customer: Customer | undefined): Promise<CartView> {
    const cart = await this.cartService.getOrCreate(null, customer?.id ?? null);
    return this.cartService.buildView(cart);
  }

  @Get(":token")
  view(
    @Param("token") token: string,
    @Query() query: CartEstimateDto,
    @CurrentCustomer() customer: Customer | undefined
  ): Promise<CartView> {
    return this.cartService.view(token, customer?.id ?? null, query.city, query.state);
  }

  @Post(":token/items")
  addItem(
    @Param("token") token: string,
    @Body() dto: AddCartItemDto,
    @CurrentCustomer() customer: Customer | undefined
  ): Promise<CartView> {
    return this.cartService.addItem(token, customer?.id ?? null, dto.productId, dto.variantId ?? null, dto.quantity);
  }

  @Put(":token/items/:itemId")
  updateItem(@Param("token") token: string, @Param("itemId") itemId: string, @Body() dto: UpdateCartItemDto): Promise<CartView> {
    return this.cartService.updateItem(token, itemId, dto.quantity, dto.variantId);
  }

  @Delete(":token/items/:itemId")
  removeItem(@Param("token") token: string, @Param("itemId") itemId: string): Promise<CartView> {
    return this.cartService.removeItem(token, itemId);
  }

  @Post(":token/coupon")
  applyCoupon(
    @Param("token") token: string,
    @Body() dto: ApplyCouponDto,
    @CurrentCustomer() customer: Customer | undefined
  ): Promise<CartView> {
    return this.cartService.applyCoupon(token, dto.code, customer?.id ?? null);
  }

  @Delete(":token/coupon")
  removeCoupon(@Param("token") token: string): Promise<CartView> {
    return this.cartService.removeCoupon(token);
  }
}
