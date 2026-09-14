import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Banner, BlogPost, MenuItem, NewsletterSubscriber, PostStatus, StaticPage, User } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { BannerDto, BlogPostDto, MenuItemDto, StaticPageDto } from "./dto/marketing.dto";

@Controller("admin/marketing")
@RequirePermissions("content.manage")
export class MarketingAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get("newsletter")
  async listSubscribers(): Promise<{ total: number; subscribers: NewsletterSubscriber[] }> {
    const [total, subscribers] = await this.prisma.$transaction([
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    ]);
    return { total, subscribers };
  }

  @Get("banners")
  listBanners(): Promise<Banner[]> {
    return this.prisma.banner.findMany({ orderBy: [{ section: "asc" }, { position: "asc" }] });
  }

  @Post("banners")
  createBanner(@Body() dto: BannerDto): Promise<Banner> {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        mobileImageUrl: dto.mobileImageUrl,
        linkUrl: dto.linkUrl,
        buttonText: dto.buttonText,
        section: dto.section,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null
      }
    });
  }

  @Put("banners/:id")
  async updateBanner(@Param("id") id: string, @Body() dto: BannerDto): Promise<Banner> {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Banner no encontrado");

    return this.prisma.banner.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        mobileImageUrl: dto.mobileImageUrl,
        linkUrl: dto.linkUrl,
        buttonText: dto.buttonText,
        section: dto.section,
        position: dto.position,
        isActive: dto.isActive,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined
      }
    });
  }

  @Delete("banners/:id")
  async deleteBanner(@Param("id") id: string): Promise<{ deleted: boolean }> {
    await this.prisma.banner.delete({ where: { id } });
    return { deleted: true };
  }

  @Get("pages")
  listPages(): Promise<StaticPage[]> {
    return this.prisma.staticPage.findMany({ orderBy: { title: "asc" } });
  }

  @Post("pages")
  createPage(@Body() dto: StaticPageDto, @CurrentUser() actor: User): Promise<StaticPage> {
    void this.auditService.log({ userId: actor.id, action: "page.created", entity: "StaticPage", entityId: dto.slug });
    return this.prisma.staticPage.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        isActive: dto.isActive ?? true,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription
      }
    });
  }

  @Put("pages/:id")
  updatePage(@Param("id") id: string, @Body() dto: StaticPageDto): Promise<StaticPage> {
    return this.prisma.staticPage.update({
      where: { id },
      data: {
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        isActive: dto.isActive,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription
      }
    });
  }

  @Delete("pages/:id")
  async deletePage(@Param("id") id: string): Promise<{ deleted: boolean }> {
    await this.prisma.staticPage.delete({ where: { id } });
    return { deleted: true };
  }

  @Get("blog")
  listPosts(): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Post("blog")
  createPost(@Body() dto: BlogPostDto, @CurrentUser() actor: User): Promise<BlogPost> {
    const status = dto.status ?? PostStatus.DRAFT;
    return this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        authorId: actor.id
      }
    });
  }

  @Put("blog/:id")
  async updatePost(@Param("id") id: string, @Body() dto: BlogPostDto): Promise<BlogPost> {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Entrada no encontrada");

    const becomesPublished = dto.status === PostStatus.PUBLISHED && existing.status !== PostStatus.PUBLISHED;

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        status: dto.status,
        publishedAt: becomesPublished ? new Date() : undefined,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined
      }
    });
  }

  @Delete("blog/:id")
  async deletePost(@Param("id") id: string): Promise<{ deleted: boolean }> {
    await this.prisma.blogPost.delete({ where: { id } });
    return { deleted: true };
  }

  @Get("menu")
  listMenuItems(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({ orderBy: [{ location: "asc" }, { position: "asc" }] });
  }

  @Post("menu")
  createMenuItem(@Body() dto: MenuItemDto): Promise<MenuItem> {
    return this.prisma.menuItem.create({
      data: {
        location: dto.location,
        label: dto.label,
        url: dto.url,
        position: dto.position ?? 0,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true
      }
    });
  }

  @Put("menu/:id")
  updateMenuItem(@Param("id") id: string, @Body() dto: MenuItemDto): Promise<MenuItem> {
    return this.prisma.menuItem.update({
      where: { id },
      data: {
        location: dto.location,
        label: dto.label,
        url: dto.url,
        position: dto.position,
        parentId: dto.parentId,
        isActive: dto.isActive
      }
    });
  }

  @Delete("menu/:id")
  async deleteMenuItem(@Param("id") id: string): Promise<{ deleted: boolean }> {
    await this.prisma.menuItem.delete({ where: { id } });
    return { deleted: true };
  }
}
