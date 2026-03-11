'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { stocksApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/types';

// ─── Helpers ─────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n?.toFixed(decimals) ?? '—';
}

function fmtVolume(v: number): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// ─── Stock card ───────────────────────────

function StockCard({ item, onRemove }: { item: WatchlistItem; onRemove: (symbol: string) => void }) {
  const q = item.quote;
  const isUp = q ? q.change >= 0 : null;

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.symbol)}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Symbol + name */}
      <div className="mb-3">
        <p className="text-lg font-bold leading-none">{item.symbol}</p>
      </div>

      {q ? (
        <>
          {/* Price */}
          <p className="text-2xl font-semibold">${fmt(q.price)}</p>

          {/* Change */}
          <div className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            isUp ? 'text-green-500' : 'text-red-500',
          )}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isUp ? '+' : ''}{fmt(q.change)} ({isUp ? '+' : ''}{fmt(q.changePercent)}%)
          </div>

          {/* Meta row */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
            {[
              { label: 'High',   value: `$${fmt(q.high)}` },
              { label: 'Low',    value: `$${fmt(q.low)}` },
              { label: 'Volume', value: fmtVolume(q.volume) },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-xs font-medium">{m.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground mt-2">Quote unavailable</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function StocksPage() {
  const [items, setItems]       = useState<WatchlistItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [adding, setAdding]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await stocksApi.watchlist();
      setItems(res.data);
    } catch {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const sym = search.trim().toUpperCase();
    if (!sym) return;
    setAdding(true);
    try {
      await stocksApi.add(sym);
      setSearch('');
      await fetchWatchlist();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to add stock');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(symbol: string) {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    try { await stocksApi.remove(symbol); } catch { fetchWatchlist(); }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchWatchlist();
    setRefreshing(false);
  }

  const totalValue = items.reduce((s, i) => s + (i.quote?.price ?? 0), 0);
  const gainers    = items.filter((i) => (i.quote?.change ?? 0) > 0).length;
  const losers     = items.filter((i) => (i.quote?.change ?? 0) < 0).length;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Stocks" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Watching',  value: items.length },
            { label: 'Gainers',   value: gainers,  color: 'text-green-500' },
            { label: 'Losers',    value: losers,   color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('mt-1 text-2xl font-semibold', s.color ?? 'text-foreground')}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add + refresh row */}
        <div className="flex gap-2">
          <form onSubmit={handleAdd} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ticker symbol (AAPL, RELIANCE.NS, TCS.BO…)"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={!search.trim() || adding}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No stocks in watchlist</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Add a ticker symbol above to start tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <StockCard key={item.symbol} item={item} onRemove={handleRemove} />
            ))}
          </div>
        )}

        {/* API note */}
        <p className="text-xs text-muted-foreground/60 text-center">
          Powered by Yahoo Finance · Free · US stocks, Indian NSE (.NS), BSE (.BO) · Prices may be delayed 15–20 min
        </p>
      </div>
    </div>
  );
}
