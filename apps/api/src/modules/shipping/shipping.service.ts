import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface ShippingQuote {
  available: boolean;
  zoneId: string | null;
  zoneName: string | null;
  rate: number;
  freeShipping: boolean;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(city: string, state: string, subtotal: number): Promise<ShippingQuote> {
    const shippingCity = await this.prisma.shippingCity.findFirst({
      where: {
        city: { equals: city },
        state: { equals: state },
        zone: { isActive: true }
      },
      include: { zone: true }
    });

    if (!shippingCity) return { available: false, zoneId: null, zoneName: null, rate: 0, freeShipping: false };

    const threshold = shippingCity.zone.freeShippingThreshold;
    const freeShipping = threshold !== null && subtotal >= Number(threshold);

    return {
      available: true,
      zoneId: shippingCity.zone.id,
      zoneName: shippingCity.zone.name,
      rate: freeShipping ? 0 : Number(shippingCity.zone.rate),
      freeShipping
    };
  }
}
