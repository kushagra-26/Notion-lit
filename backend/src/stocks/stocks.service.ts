import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  currency: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  quote: StockQuote | null;
  addedAt: string;
}

interface QuoteCacheEntry {
  quote: StockQuote;
  timestamp: number;
}

@Injectable()
export class StocksService {
  private readonly quoteCache = new Map<string, QuoteCacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(StockWatchlist)
    private readonly watchlistRepo: Repository<StockWatchlist>,
  ) {}

  // ─── Fetch quote from Yahoo Finance (free, no API key) ──────────
  // Supports US stocks (AAPL), Indian NSE (RELIANCE.NS), BSE (TCS.BO)
  async getQuote(symbol: string): Promise<StockQuote | null> {
    const sym = symbol.toUpperCase();

    const cached = this.quoteCache.get(sym);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.quote;
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!res.ok) return cached?.quote ?? null;

      const body = (await res.json()) as {
        chart: {
          result: Array<{
            meta: {
              symbol: string;
              regularMarketPrice: number;
              chartPreviousClose: number;
              regularMarketChangePercent: number;
              regularMarketVolume: number;
              regularMarketDayHigh: number;
              regularMarketDayLow: number;
              currency: string;
            };
          }> | null;
          error: unknown;
        };
      };

      const meta = body?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return cached?.quote ?? null;

      const prev = meta.chartPreviousClose ?? meta.regularMarketPrice;
      const quote: StockQuote = {
        symbol: sym,
        price: meta.regularMarketPrice,
        previousClose: prev,
        change: parseFloat((meta.regularMarketPrice - prev).toFixed(2)),
        changePercent: parseFloat((meta.regularMarketChangePercent ?? 0).toFixed(2)),
        high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
        low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
        volume: meta.regularMarketVolume ?? 0,
        currency: meta.currency ?? 'USD',
      };

      this.quoteCache.set(sym, { quote, timestamp: Date.now() });
      return quote;
    } catch {
      return cached?.quote ?? null;
    }
  }

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

  async addToWatchlist(userId: string, symbol: string): Promise<StockWatchlist> {
    const sym = symbol.toUpperCase();
    const existing = await this.watchlistRepo.findOne({ where: { userId, symbol: sym } });
    if (existing) throw new ConflictException(`${sym} is already in your watchlist`);
    return this.watchlistRepo.save(this.watchlistRepo.create({ userId, symbol: sym }));
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    const sym = symbol.toUpperCase();
    const entry = await this.watchlistRepo.findOne({ where: { userId, symbol: sym } });
    if (!entry) throw new NotFoundException(`${sym} not found in your watchlist`);
    await this.watchlistRepo.remove(entry);
  }
}
