import { Body, Controller, Get, NotFoundException, Param, Put, Query } from "@nestjs/common";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PaginatedResult, PaginationDto, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { ModerationStatus, Prisma, ProductQuestion, ProductReview, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

class ModerationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;
}

class ModerateReviewDto {
  @IsEnum(ModerationStatus)
  status!: ModerationStatus;
}

class AnswerQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  answer?: string;

  @IsEnum(ModerationStatus)
  status!: ModerationStatus;
}

type ReviewRow = Prisma.ProductReviewGetPayload<{ include: { product: { select: { name: true; slug: true } } } }>;
type QuestionRow = Prisma.ProductQuestionGetPayload<{ include: { product: { select: { name: true; slug: true } } } }>;

@Controller("admin/moderation")
@RequirePermissions("content.manage")
export class ModerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get("reviews")
  async listReviews(@Query() query: ModerationQueryDto): Promise<PaginatedResult<ReviewRow>> {
    const where: Prisma.ProductReviewWhereInput = { status: query.status };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.productReview.findMany({
        where,
        include: { product: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.productReview.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Put("reviews/:id")
  async moderateReview(@Param("id") id: string, @Body() dto: ModerateReviewDto, @CurrentUser() actor: User): Promise<ProductReview> {
    const existing = await this.prisma.productReview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Reseña no encontrada");

    const review = await this.prisma.productReview.update({ where: { id }, data: { status: dto.status } });

    await this.auditService.log({
      userId: actor.id,
      action: "review.moderated",
      entity: "ProductReview",
      entityId: id,
      metadata: { status: dto.status }
    });

    return review;
  }

  @Get("questions")
  async listQuestions(@Query() query: ModerationQueryDto): Promise<PaginatedResult<QuestionRow>> {
    const where: Prisma.ProductQuestionWhereInput = { status: query.status };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.productQuestion.findMany({
        where,
        include: { product: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        ...skipTake(query.page, query.perPage)
      }),
      this.prisma.productQuestion.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Put("questions/:id")
  async answerQuestion(@Param("id") id: string, @Body() dto: AnswerQuestionDto, @CurrentUser() actor: User): Promise<ProductQuestion> {
    const existing = await this.prisma.productQuestion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Pregunta no encontrada");

    const question = await this.prisma.productQuestion.update({
      where: { id },
      data: {
        status: dto.status,
        answer: dto.answer,
        answeredAt: dto.answer ? new Date() : existing.answeredAt
      }
    });

    await this.auditService.log({
      userId: actor.id,
      action: "question.moderated",
      entity: "ProductQuestion",
      entityId: id,
      metadata: { status: dto.status, answered: Boolean(dto.answer) }
    });

    return question;
  }
}
