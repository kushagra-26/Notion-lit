import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private cache: CacheEntry | null = null;
  private readonly CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

  constructor(private readonly config: ConfigService) {}

  async getTechNews(): Promise<NewsArticle[]> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      this.logger.debug('Returning cached news');
      return this.cache.data;
    }

    const apiKey = this.config.get<string>('NEWS_API_KEY');
    if (!apiKey) {
      this.logger.warn('NEWS_API_KEY is not set — returning empty news list');
      return [];
    }

    try {
      const url =
        `https://newsapi.org/v2/top-headlines` +
        `?category=technology&language=en&pageSize=20&apiKey=${apiKey}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`NewsAPI error: ${res.status} ${res.statusText}`);
      }

      const body = (await res.json()) as {
        articles: Array<{
          title: string;
          description: string | null;
          url: string;
          urlToImage: string | null;
          source: { name: string };
          publishedAt: string;
        }>;
      };

      const articles: NewsArticle[] = (body.articles ?? [])
        .filter((a) => a.title && a.title !== '[Removed]')
        .map((a) => ({
          title: a.title,
          description: a.description ?? '',
          url: a.url,
          imageUrl: a.urlToImage ?? '',
          source: a.source?.name ?? 'Unknown',
          publishedAt: a.publishedAt,
        }));

      this.cache = { data: articles, timestamp: Date.now() };
      this.logger.log(`Fetched ${articles.length} tech articles`);
      return articles;
    } catch (err) {
      this.logger.error('Failed to fetch tech news', err);
      // Return stale cache rather than nothing if available
      return this.cache?.data ?? [];
    }
  }
}
