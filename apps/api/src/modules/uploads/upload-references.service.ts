import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UploadReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async isReferenced(fileName: string): Promise<boolean> {
    const match = { contains: fileName };
    const lookups = await Promise.all([
      this.prisma.productImage.findFirst({ where: { url: match }, select: { id: true } }),
      this.prisma.productVariant.findFirst({ where: { imageUrl: match }, select: { id: true } }),
      this.prisma.productOptionValue.findFirst({ where: { swatchImageUrl: match }, select: { id: true } }),
      this.prisma.productVideo.findFirst({ where: { OR: [{ url: match }, { posterUrl: match }] }, select: { id: true } }),
      this.prisma.productDocument.findFirst({ where: { url: match }, select: { id: true } }),
      this.prisma.productContentBlock.findFirst({ where: { imageUrl: match }, select: { id: true } }),
      this.prisma.brand.findFirst({ where: { OR: [{ logoUrl: match }, { bannerUrl: match }] }, select: { id: true } }),
      this.prisma.category.findFirst({ where: { bannerUrl: match }, select: { id: true } }),
      this.prisma.banner.findFirst({ where: { OR: [{ imageUrl: match }, { mobileImageUrl: match }] }, select: { id: true } }),
      this.prisma.blogPost.findFirst({ where: { OR: [{ coverImageUrl: match }, { content: match }] }, select: { id: true } }),
      this.prisma.staticPage.findFirst({ where: { content: match }, select: { id: true } })
    ]);
    if (lookups.some((row) => row !== null)) return true;

    const settings = await this.prisma.setting.findMany({ select: { value: true } });
    return settings.some((setting) => JSON.stringify(setting.value).includes(fileName));
  }
}
