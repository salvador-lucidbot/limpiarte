import { BadRequestException, Injectable } from "@nestjs/common";
import { Coupon, DiscountType, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface CouponEvaluationItem {
  productId: string;
  categoryId: string | null;
  lineTotal: number;
}

export interface CouponEvaluation {
  coupon: Coupon;
  discount: number;
}

type CouponWithRestrictions = Prisma.CouponGetPayload<{ include: { products: true; categories: true } }>;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(code: string, items: CouponEvaluationItem[], customerId: string | null): Promise<CouponEvaluation> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { products: true, categories: true }
    });

    if (!coupon || !coupon.isActive) throw new BadRequestException("Cupón inválido");

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException("El cupón aún no está vigente");
    if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestException("El cupón expiró");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException("El cupón alcanzó su límite de usos");
    }

    if (coupon.maxUsesPerCustomer !== null && customerId) {
      const customerUses = await this.prisma.couponRedemption.count({ where: { couponId: coupon.id, customerId } });
      if (customerUses >= coupon.maxUsesPerCustomer) {
        throw new BadRequestException("Ya usaste este cupón el máximo de veces permitido");
      }
    }

    const eligibleSubtotal = this.eligibleSubtotal(coupon, items);
    if (eligibleSubtotal <= 0) throw new BadRequestException("El cupón no aplica a los productos del carrito");

    const cartSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (coupon.minSubtotal !== null && cartSubtotal < Number(coupon.minSubtotal)) {
      throw new BadRequestException(`El cupón requiere una compra mínima de ${Number(coupon.minSubtotal)}`);
    }

    const discount = this.computeDiscount(coupon, eligibleSubtotal);

    return { coupon, discount };
  }

  private eligibleSubtotal(coupon: CouponWithRestrictions, items: CouponEvaluationItem[]): number {
    const hasRestrictions = coupon.products.length > 0 || coupon.categories.length > 0;
    if (!hasRestrictions) return items.reduce((sum, item) => sum + item.lineTotal, 0);

    const productIds = new Set(coupon.products.map((link) => link.productId));
    const categoryIds = new Set(coupon.categories.map((link) => link.categoryId));

    return items
      .filter((item) => productIds.has(item.productId) || (item.categoryId !== null && categoryIds.has(item.categoryId)))
      .reduce((sum, item) => sum + item.lineTotal, 0);
  }

  private computeDiscount(coupon: Coupon, eligibleSubtotal: number): number {
    if (coupon.discountType === DiscountType.PERCENT) {
      return Math.round(eligibleSubtotal * (Number(coupon.value) / 100) * 100) / 100;
    }
    return Math.min(Number(coupon.value), eligibleSubtotal);
  }
}
