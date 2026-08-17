import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateShippingZoneDto, ShippingQuoteDto, UpdateShippingZoneDto } from "./dto/shipping.dto";
import { ShippingQuote, ShippingService } from "./shipping.service";

type ZoneWithCities = Prisma.ShippingZoneGetPayload<{ include: { cities: true } }>;

@Controller()
export class ShippingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService
  ) {}

  @Public()
  @Get("shipping/quote")
  quote(@Query() query: ShippingQuoteDto): Promise<ShippingQuote> {
    return this.shippingService.quote(query.city, query.state, query.subtotal);
  }

  @Public()
  @Get("shipping/cities")
  async cities(): Promise<{ city: string; state: string }[]> {
    const rows = await this.prisma.shippingCity.findMany({
      where: { zone: { isActive: true } },
      select: { city: true, state: true },
      orderBy: [{ state: "asc" }, { city: "asc" }]
    });
    return rows;
  }

  @Get("admin/shipping/zones")
  @RequirePermissions("settings.manage")
  listZones(): Promise<ZoneWithCities[]> {
    return this.prisma.shippingZone.findMany({ include: { cities: true }, orderBy: { name: "asc" } });
  }

  @Post("admin/shipping/zones")
  @RequirePermissions("settings.manage")
  createZone(@Body() dto: CreateShippingZoneDto): Promise<ZoneWithCities> {
    return this.prisma.shippingZone.create({
      data: {
        name: dto.name,
        rate: dto.rate,
        freeShippingThreshold: dto.freeShippingThreshold ?? null,
        isActive: dto.isActive ?? true,
        cities: { create: dto.cities.map((cityDto) => ({ city: cityDto.city, state: cityDto.state })) }
      },
      include: { cities: true }
    });
  }

  @Put("admin/shipping/zones/:id")
  @RequirePermissions("settings.manage")
  async updateZone(@Param("id") id: string, @Body() dto: UpdateShippingZoneDto): Promise<ZoneWithCities> {
    const existing = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Zona no encontrada");

    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        name: dto.name,
        rate: dto.rate,
        freeShippingThreshold: dto.freeShippingThreshold,
        isActive: dto.isActive,
        cities: dto.cities
          ? { deleteMany: {}, create: dto.cities.map((cityDto) => ({ city: cityDto.city, state: cityDto.state })) }
          : undefined
      },
      include: { cities: true }
    });
  }

  @Delete("admin/shipping/zones/:id")
  @RequirePermissions("settings.manage")
  async deleteZone(@Param("id") id: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Zona no encontrada");

    await this.prisma.shippingZone.delete({ where: { id } });
    return { deleted: true };
  }
}
