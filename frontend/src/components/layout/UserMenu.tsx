'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative mt-auto border-t border-border px-2 py-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {initials}
        </div>
        <span className="flex-1 truncate text-left text-sm">{user.username}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-lg border border-border bg-card shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors">
              <User className="h-3.5 w-3.5" />
              Profile
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
