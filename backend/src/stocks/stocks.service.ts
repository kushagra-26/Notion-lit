import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StockWatchlist } from './stock-watchlist.entity';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  quote: StockQuote | null;
  addedAt: string;
}

// ─── Internal cache shape ─────────────────────────────────────────────────────

interface QuoteCacheEntry {
  quote: StockQuote;
  timestamp: number;
}

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  /** Per-symbol in-memory quote cache */
  private readonly quoteCache = new Map<string, QuoteCacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(StockWatchlist)
    private readonly watchlistRepo: Repository<StockWatchlist>,
    private readonly config: ConfigService,
  ) {}

  // ─── Fetch a single quote from Alpha Vantage ────────────────────
  async getQuote(symbol: string): Promise<StockQuote | null> {
    const upperSymbol = symbol.toUpperCase();

    // Return from cache if still fresh
    const cached = this.quoteCache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for ${upperSymbol}`);
      return cached.quote;
    }

    const apiKey = this.config.get<string>('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      this.logger.warn('ALPHA_VANTAGE_API_KEY is not set — skipping quote fetch');
      return null;
    }

    try {
      const url =
        `https://www.alphavantage.co/query` +
        `?function=GLOBAL_QUOTE&symbol=${upperSymbol}&apikey=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Alpha Vantage error: ${res.status} ${res.statusText}`);
      }

      const body = (await res.json()) as {
        'Global Quote': Record<string, string>;
      };

      const raw = body['Global Quote'];
      if (!raw || !raw['05. price']) {
        this.logger.warn(`No quote data returned for ${upperSymbol}`);
        return null;
      }

      const quote: StockQuote = {
        symbol: upperSymbol,
        price: parseFloat(raw['05. price']),
        change: parseFloat(raw['09. change']),
        changePercent: parseFloat(raw['10. change percent']?.replace('%', '') ?? '0'),
        high: parseFloat(raw['03. high']),
        low: parseFloat(raw['04. low']),
        volume: parseInt(raw['06. volume'], 10),
        previousClose: parseFloat(raw['08. previous close']),
      };

      this.quoteCache.set(upperSymbol, { quote, timestamp: Date.now() });
      this.logger.log(`Fetched quote for ${upperSymbol}: $${quote.price}`);
      return quote;
    } catch (err) {
      this.logger.error(`Failed to fetch quote for ${upperSymbol}`, err);
      // Return stale cache if available
      return cached?.quote ?? null;
    }
  }

  // ─── Get full watchlist with live prices ────────────────────────
  async getWatchlistWithPrices(userId: string): Promise<WatchlistItem[]> {
    const items = await this.watchlistRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      items.map(async (item) => ({
        id: item.id,
        symbol: item.symbol,
        quote: await this.getQuote(item.symbol),
        addedAt: item.createdAt.toISOString(),
      })),
    );
  }

  // ─── Add symbol to watchlist ────────────────────────────────────
  async addToWatchlist(userId: string, symbol: string): Promise<StockWatchlist> {
    const upperSymbol = symbol.toUpperCase();

    // Check for duplicate (unique constraint would also catch it, but give a friendlier error)
    const existing = await this.watchlistRepo.findOne({
      where: { userId, symbol: upperSymbol },
    });
    if (existing) {
      throw new ConflictException(`${upperSymbol} is already in your watchlist`);
    }

    const entry = this.watchlistRepo.create({ userId, symbol: upperSymbol });
    return this.watchlistRepo.save(entry);
  }

  // ─── Remove symbol from watchlist ──────────────────────────────
  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    const upperSymbol = symbol.toUpperCase();
    const entry = await this.watchlistRepo.findOne({
      where: { userId, symbol: upperSymbol },
    });
    if (!entry) {
      throw new NotFoundException(`${upperSymbol} not found in your watchlist`);
    }
    await this.watchlistRepo.remove(entry);
  }
}
