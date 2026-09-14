import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { CurrentCustomer } from "../../common/decorators/current-customer.decorator";
import { CustomerOnly } from "../../common/decorators/customer-only.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { PaginationDto } from "../../common/pagination/pagination.dto";
import { Customer } from "../../generated/prisma/client";
import { EngagementService } from "./engagement.service";

class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  body!: string;
}

class CreateQuestionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  question!: string;
}

class StockAlertDto {
  @IsEmail()
  email!: string;
}

@Controller("catalog/products")
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Public()
  @Get(":slug/reviews")
  listReviews(@Param("slug") slug: string, @Query() query: PaginationDto): ReturnType<EngagementService["listReviews"]> {
    return this.engagementService.listReviews(slug, query.page, query.perPage);
  }

  @CustomerOnly()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(":id/reviews")
  createReview(
    @Param("id") id: string,
    @Body() dto: CreateReviewDto,
    @CurrentCustomer() customer: Customer
  ): ReturnType<EngagementService["createReview"]> {
    return this.engagementService.createReview(id, customer, dto.rating, dto.body, dto.title);
  }

  @Public()
  @Get(":slug/questions")
  listQuestions(@Param("slug") slug: string, @Query() query: PaginationDto): ReturnType<EngagementService["listQuestions"]> {
    return this.engagementService.listQuestions(slug, query.page, query.perPage);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(":id/questions")
  createQuestion(@Param("id") id: string, @Body() dto: CreateQuestionDto): ReturnType<EngagementService["createQuestion"]> {
    return this.engagementService.createQuestion(id, dto.authorName, dto.email, dto.question);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(":id/stock-alert")
  subscribeStockAlert(@Param("id") id: string, @Body() dto: StockAlertDto): ReturnType<EngagementService["subscribeStockAlert"]> {
    return this.engagementService.subscribeStockAlert(id, dto.email);
  }
}
