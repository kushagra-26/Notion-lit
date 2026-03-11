import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockWatchlist } from './stock-watchlist.entity';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  priceInr?: number;
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

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface QuoteCacheEntry {
  quote: StockQuote;
  timestamp: number;
}

@Injectable()
export class StocksService {
  private readonly quoteCache = new Map<string, QuoteCacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private usdInrRate: { rate: number; timestamp: number } | null = null;
  private readonly RATE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(StockWatchlist)
    private readonly watchlistRepo: Repository<StockWatchlist>,
  ) {}

  // ─── USD → INR exchange rate ─────────────────────────────────────
  private async getUsdToInrRate(): Promise<number> {
    if (this.usdInrRate && Date.now() - this.usdInrRate.timestamp < this.RATE_TTL) {
      return this.usdInrRate.rate;
    }
    try {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );
      const body = (await res.json()) as {
        chart: { result: Array<{ meta: { regularMarketPrice: number } }> | null };
      };
      const rate = body?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 83.5;
      this.usdInrRate = { rate, timestamp: Date.now() };
      return rate;
    } catch {
      return this.usdInrRate?.rate ?? 83.5;
    }
  }

  // ─── Fetch quote from Yahoo Finance ─────────────────────────────
  async getQuote(symbol: string): Promise<StockQuote | null> {
    const sym = symbol.toUpperCase();
    const cached = this.quoteCache.get(sym);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) return cached.quote;

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return cached?.quote ?? null;

      const body = (await res.json()) as {
        chart: {
          result: Array<{
            meta: {
              symbol: string;
              shortName?: string;
              longName?: string;
              regularMarketPrice: number;
              chartPreviousClose: number;
              regularMarketChangePercent: number;
              regularMarketVolume: number;
              regularMarketDayHigh: number;
              regularMarketDayLow: number;
              currency: string;
            };
          }> | null;
        };
      };

      const meta = body?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return cached?.quote ?? null;

      const prev = meta.chartPreviousClose ?? meta.regularMarketPrice;
      const currency = meta.currency ?? 'USD';

      // Shorten company name to ≤15 chars for display
      const rawName = meta.shortName || meta.longName || sym;
      const name = rawName.length > 15 ? rawName.slice(0, 14) + '…' : rawName;

      // Convert to INR if USD
      let priceInr: number | undefined;
      if (currency === 'USD') {
        const rate = await this.getUsdToInrRate();
        priceInr = parseFloat((meta.regularMarketPrice * rate).toFixed(2));
      }

      const quote: StockQuote = {
        symbol: sym,
        name,
        price: meta.regularMarketPrice,
        priceInr,
        previousClose: prev,
        change: parseFloat((meta.regularMarketPrice - prev).toFixed(2)),
        changePercent: parseFloat((meta.regularMarketChangePercent ?? 0).toFixed(2)),
        high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
        low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
        volume: meta.regularMarketVolume ?? 0,
        currency,
      };

      this.quoteCache.set(sym, { quote, timestamp: Date.now() });
      return quote;
    } catch {
      return cached?.quote ?? null;
    }
  }

  // ─── Search symbols via Yahoo Finance ───────────────────────────
  async searchSymbols(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 1) return [];
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return [];

      const body = (await res.json()) as {
        quotes: Array<{
          symbol: string;
          shortname?: string;
          longname?: string;
          exchDisp?: string;
          quoteType?: string;
        }>;
      };

      return (body.quotes ?? [])
        .filter((q) => q.quoteType === 'EQUITY' && q.symbol)
        .slice(0, 8)
        .map((q) => {
          const rawName = q.shortname || q.longname || q.symbol;
          return {
            symbol: q.symbol,
            name: rawName.length > 20 ? rawName.slice(0, 19) + '…' : rawName,
            exchange: q.exchDisp || '',
          };
        });
    } catch {
      return [];
    }
  }

  async getWatchlistWithPrices(userId: string): Promise<WatchlistItem[]> {
    const items = await this.watchlistRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
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
