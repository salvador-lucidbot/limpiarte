import { Injectable } from "@nestjs/common";
import { ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PricingService } from "./pricing.service";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

@Injectable()
export class ProductFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService
  ) {}

  async buildXml(): Promise<string> {
    const storefrontUrl = (process.env.STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const storeName = process.env.MAIL_FROM_NAME ?? "Limpiarte";

    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: ProductStatus.ACTIVE },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { where: { isActive: true }, select: { stock: true } }
      },
      take: 1000
    });

    const items = products.map((product) => {
      const pricing = this.pricingService.resolve(product);
      const totalStock = product.variants.length > 0
        ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
        : product.stock;
      const availability = totalStock > 0 || product.allowBackorder ? "in_stock" : "out_of_stock";
      const image = product.images[0]?.url;

      const fields = [
        `<g:id>${escapeXml(product.sku ?? product.id)}</g:id>`,
        `<g:title>${escapeXml(product.name)}</g:title>`,
        `<g:description>${escapeXml(product.description ?? product.name)}</g:description>`,
        `<g:link>${escapeXml(`${storefrontUrl}/producto/${product.slug}`)}</g:link>`,
        image ? `<g:image_link>${escapeXml(image)}</g:image_link>` : "",
        `<g:price>${pricing.price.toFixed(0)} COP</g:price>`,
        `<g:availability>${availability}</g:availability>`,
        `<g:condition>new</g:condition>`,
        product.brand ? `<g:brand>${escapeXml(product.brand.name)}</g:brand>` : "<g:identifier_exists>no</g:identifier_exists>",
        product.category ? `<g:product_type>${escapeXml(product.category.name)}</g:product_type>` : ""
      ].filter(Boolean);

      return `<item>${fields.join("")}</item>`;
    });

    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
      `<channel>`,
      `<title>${escapeXml(storeName)}</title>`,
      `<link>${escapeXml(storefrontUrl)}</link>`,
      `<description>${escapeXml(`Catálogo de productos de ${storeName}`)}</description>`,
      ...items,
      `</channel>`,
      `</rss>`
    ].join("");
  }
}
