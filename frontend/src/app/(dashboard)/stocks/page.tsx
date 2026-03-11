'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Search, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { stocksApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { WatchlistItem, SearchResult } from '@/types';

// ─── Helpers ─────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n != null ? n.toFixed(decimals) : '—';
}

function fmtCurrency(price: number, currency: string): string {
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${fmt(price)}`;
}

function fmtVolume(v: number): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// ─── Stock card ───────────────────────────

function StockCard({ item, onRemove }: { item: WatchlistItem; onRemove: (s: string) => void }) {
  const q = item.quote;
  const isUp = q ? q.change >= 0 : null;
  const isIndian = q?.currency === 'INR';

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <button
        onClick={() => onRemove(item.symbol)}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Symbol + name */}
      <div className="mb-2 pr-6">
        <p className="text-base font-bold leading-tight">{item.symbol}</p>
        {q?.name && (
          <p className="text-[11px] text-muted-foreground truncate">{q.name}</p>
        )}
      </div>

      {q ? (
        <>
          {/* Primary price */}
          <p className="text-xl font-semibold">
            {fmtCurrency(q.price, q.currency)}
          </p>

          {/* INR equivalent for USD stocks */}
          {!isIndian && q.priceInr && (
            <p className="text-xs text-muted-foreground">≈ ₹{fmt(q.priceInr)}</p>
          )}

          {/* Change */}
          <div className={cn(
            'mt-1 flex items-center gap-1 text-xs font-medium',
            isUp ? 'text-green-500' : 'text-red-500',
          )}>
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isUp ? '+' : ''}{fmt(q.change)} ({isUp ? '+' : ''}{fmt(q.changePercent)}%)
          </div>

          {/* Meta */}
          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-border pt-2.5">
            {[
              { label: 'High',   value: fmtCurrency(q.high, q.currency) },
              { label: 'Low',    value: fmtCurrency(q.low, q.currency) },
              { label: 'Volume', value: fmtVolume(q.volume) },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-[11px] font-medium">{m.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Quote unavailable</p>
      )}
    </div>
  );
}

// ─── Search input with autocomplete ──────

function StockSearch({ onAdd }: { onAdd: (symbol: string) => Promise<void> }) {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [adding, setAdding]         = useState(false);
  const [open, setOpen]             = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef                  = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await stocksApi.search(query);
        setResults(res.data);
        setOpen(res.data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { clearTimeout(debounceRef.current); };
  }, [query]);

  async function handleSelect(symbol: string) {
    setOpen(false);
    setQuery(symbol);
    setAdding(true);
    try {
      await onAdd(symbol);
      setQuery('');
    } finally {
      setAdding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (!sym) return;
    setOpen(false);
    setAdding(true);
    try {
      await onAdd(sym);
      setQuery('');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search by name or symbol (e.g. Reliance, AAPL, TCS.NS)"
            className="w-full rounded-lg border border-border bg-white dark:bg-zinc-900 pl-9 pr-9 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || adding}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              type="button"
              onMouseDown={() => handleSelect(r.symbol)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{r.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground truncate">{r.name}</span>
              </div>
              {r.exchange && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {r.exchange}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function StocksPage() {
  const [items, setItems]       = useState<WatchlistItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
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

  async function handleAdd(symbol: string) {
    setError(null);
    try {
      await stocksApi.add(symbol);
      await fetchWatchlist();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to add stock');
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

  const gainers = items.filter((i) => (i.quote?.change ?? 0) > 0).length;
  const losers  = items.filter((i) => (i.quote?.change ?? 0) < 0).length;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Stocks" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Watching', value: items.length, color: '' },
            { label: 'Gainers',  value: gainers,      color: 'text-green-500' },
            { label: 'Losers',   value: losers,        color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('mt-1 text-2xl font-semibold', s.color || 'text-foreground')}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="flex gap-2">
          <StockSearch onAdd={handleAdd} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No stocks in watchlist</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Search and add stocks above · Indian stocks: add .NS (NSE) or .BO (BSE)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <StockCard key={item.symbol} item={item} onRemove={handleRemove} />
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50">
          Yahoo Finance · Free · US: AAPL · NSE: RELIANCE.NS · BSE: TCS.BO · Prices delayed 15–20 min
        </p>
      </div>
    </div>
  );
}
