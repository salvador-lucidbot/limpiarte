import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { PaginatedResult, PaginationDto, paginate, skipTake } from "../../common/pagination/pagination.dto";
import { Banner, BlogPost, MenuItem, PostStatus, StaticPage } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Public()
@Controller("content")
export class ContentPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("banners")
  banners(): Promise<Banner[]> {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      orderBy: [{ section: "asc" }, { position: "asc" }]
    });
  }

  @Get("menu")
  menu(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ location: "asc" }, { position: "asc" }]
    });
  }

  @Get("pages/:slug")
  async page(@Param("slug") slug: string): Promise<StaticPage> {
    const page = await this.prisma.staticPage.findFirst({ where: { slug, isActive: true } });
    if (!page) throw new NotFoundException("Página no encontrada");
    return page;
  }

  @Get("blog")
  async blog(@Query() query: PaginationDto): Promise<PaginatedResult<BlogPost>> {
    const where = { status: PostStatus.PUBLISHED };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, ...skipTake(query.page, query.perPage) }),
      this.prisma.blogPost.count({ where })
    ]);

    return paginate(data, total, query.page, query.perPage);
  }

  @Get("blog/:slug")
  async post(@Param("slug") slug: string): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findFirst({ where: { slug, status: PostStatus.PUBLISHED } });
    if (!post) throw new NotFoundException("Entrada no encontrada");
    return post;
  }
}
