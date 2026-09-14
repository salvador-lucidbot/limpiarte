import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Customer, ModerationStatus, OrderStatus, Prisma, ProductStatus } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

export interface ReviewView {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: { rating: number; count: number }[];
}

export interface QuestionView {
  id: string;
  authorName: string;
  question: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
}

const PURCHASED_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async listReviews(slug: string, page: number, perPage: number): Promise<PaginatedResult<ReviewView> & { summary: ReviewSummary }> {
    const product = await this.requireProductBySlug(slug);
    const where: Prisma.ProductReviewWhereInput = { productId: product.id, status: ModerationStatus.APPROVED };

    const [data, total, groups] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        orderBy: [{ isVerifiedPurchase: "desc" }, { createdAt: "desc" }],
        ...skipTake(page, perPage)
      }),
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.groupBy({ by: ["rating"], where, _count: { _all: true } })
    ]);

    const count = groups.reduce((sum, group) => sum + group._count._all, 0);
    const weighted = groups.reduce((sum, group) => sum + group.rating * group._count._all, 0);
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: groups.find((group) => group.rating === rating)?._count._all ?? 0
    }));

    const views: ReviewView[] = data.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt
    }));

    return {
      ...paginate(views, total, page, perPage),
      summary: {
        average: count > 0 ? Math.round((weighted / count) * 10) / 10 : null,
        count,
        distribution
      }
    };
  }

  async createReview(
    productId: string,
    customer: Customer,
    rating: number,
    body: string,
    title?: string
  ): Promise<{ status: ModerationStatus }> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const existing = await this.prisma.productReview.findFirst({ where: { productId, customerId: customer.id } });
    if (existing) throw new BadRequestException("Ya enviaste una reseña para este producto");

    const purchase = await this.prisma.orderItem.findFirst({
      where: { productId, order: { customerId: customer.id, status: { in: PURCHASED_STATUSES } } }
    });

    const review = await this.prisma.productReview.create({
      data: {
        productId,
        customerId: customer.id,
        authorName: `${customer.firstName} ${customer.lastName.charAt(0)}.`,
        rating,
        title,
        body,
        isVerifiedPurchase: purchase !== null
      }
    });

    return { status: review.status };
  }

  async listQuestions(slug: string, page: number, perPage: number): Promise<PaginatedResult<QuestionView>> {
    const product = await this.requireProductBySlug(slug);
    const where: Prisma.ProductQuestionWhereInput = {
      productId: product.id,
      status: ModerationStatus.APPROVED,
      answer: { not: null }
    };

    const [data, total] = await Promise.all([
      this.prisma.productQuestion.findMany({ where, orderBy: { answeredAt: "desc" }, ...skipTake(page, perPage) }),
      this.prisma.productQuestion.count({ where })
    ]);

    const views: QuestionView[] = data.map((question) => ({
      id: question.id,
      authorName: question.authorName,
      question: question.question,
      answer: question.answer,
      answeredAt: question.answeredAt,
      createdAt: question.createdAt
    }));

    return paginate(views, total, page, perPage);
  }

  async createQuestion(productId: string, authorName: string, email: string, question: string): Promise<{ received: boolean }> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    await this.prisma.productQuestion.create({
      data: { productId, authorName, email: email.toLowerCase(), question }
    });

    return { received: true };
  }

  async subscribeStockAlert(productId: string, email: string): Promise<{ subscribed: boolean }> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    await this.prisma.stockAlert.upsert({
      where: { productId_email: { productId, email: email.toLowerCase() } },
      update: { notifiedAt: null },
      create: { productId, email: email.toLowerCase() }
    });

    return { subscribed: true };
  }

  async notifyStockAlerts(productId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: ProductStatus.ACTIVE },
      include: { variants: { where: { isActive: true }, select: { stock: true } } }
    });
    if (!product) return;

    const totalStock = product.variants.length > 0
      ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      : product.stock;
    if (totalStock <= 0) return;

    const pending = await this.prisma.stockAlert.findMany({
      where: { productId, notifiedAt: null },
      take: 200
    });
    if (pending.length === 0) return;

    const productUrl = `${process.env.STOREFRONT_URL ?? ""}/producto/${product.slug}`;
    const notifiedIds: string[] = [];

    for (const alert of pending) {
      const sent = await this.mailService.sendTemplate("back_in_stock", alert.email, {
        name: "",
        productName: product.name,
        productUrl
      });
      if (sent) notifiedIds.push(alert.id);
    }

    if (notifiedIds.length === 0) return;

    await this.prisma.stockAlert.updateMany({
      where: { id: { in: notifiedIds } },
      data: { notifiedAt: new Date() }
    });
  }

  private async requireProductBySlug(slug: string): Promise<{ id: string }> {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, status: ProductStatus.ACTIVE },
      select: { id: true }
    });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }
}
