import { Controller, Get, UseGuards } from '@nestjs/common';
import { NewsService, NewsArticle } from './news.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('tech')
  getTechNews(): Promise<NewsArticle[]> {
    return this.newsService.getTechNews();
  }
}
