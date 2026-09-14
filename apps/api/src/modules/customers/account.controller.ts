import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { CustomerOnly } from "../../common/decorators/customer-only.decorator";
import { Address, Customer } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AddressDto, UpdateProfileDto } from "./dto/customer.dto";

@CustomerOnly()
@Controller("account")
export class AccountController {
  constructor(private readonly prisma: PrismaService) {}

  @Put("profile")
  async updateProfile(@CurrentCustomer() customer: Customer, @Body() dto: UpdateProfileDto): Promise<{ updated: boolean }> {
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        marketingOptIn: dto.marketingOptIn
      }
    });
    return { updated: true };
  }

  @Get("addresses")
  listAddresses(@CurrentCustomer() customer: Customer): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
  }

  @Post("addresses")
  async createAddress(@CurrentCustomer() customer: Customer, @Body() dto: AddressDto): Promise<Address> {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
    }

    return this.prisma.address.create({
      data: {
        customerId: customer.id,
        type: dto.type,
        label: dto.label,
        recipientName: dto.recipientName,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? false,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        companyName: dto.companyName
      }
    });
  }

  @Put("addresses/:id")
  async updateAddress(@CurrentCustomer() customer: Customer, @Param("id") id: string, @Body() dto: AddressDto): Promise<Address> {
    const existing = await this.prisma.address.findFirst({ where: { id, customerId: customer.id } });
    if (!existing) throw new NotFoundException("Dirección no encontrada");

    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        type: dto.type,
        label: dto.label,
        recipientName: dto.recipientName,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        companyName: dto.companyName
      }
    });
  }

  @Delete("addresses/:id")
  async deleteAddress(@CurrentCustomer() customer: Customer, @Param("id") id: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.address.findFirst({ where: { id, customerId: customer.id } });
    if (!existing) throw new NotFoundException("Dirección no encontrada");

    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }
}
