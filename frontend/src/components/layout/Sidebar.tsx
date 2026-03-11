'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Columns,
  BookOpen,
  Flame,
  TrendingUp,
  Newspaper,
  Github,
  BarChart2,
  Sparkles,
  Settings,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pagesApi } from '@/lib/api';
import { UserMenu } from './UserMenu';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/',         icon: LayoutDashboard },
  { label: 'Notes',     href: '/notes',    icon: FileText },
  { label: 'Tasks',     href: '/tasks',    icon: CheckSquare },
  { label: 'Kanban',    href: '/kanban',   icon: Columns },
  { label: 'Journal',   href: '/journal',  icon: BookOpen },
  { label: 'Habits',    href: '/habits',   icon: Flame },
  { label: 'Learning',  href: '/learning', icon: TrendingUp },
  { label: 'Stocks',    href: '/stocks',   icon: BarChart2 },
  { label: 'News',      href: '/news',     icon: Newspaper },
  { label: 'GitHub',    href: '/github',   icon: Github },
  { label: 'AI',        href: '/ai',       icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleNewPage() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await pagesApi.create({ title: 'Untitled' });
      router.push(`/notes/${res.data.id}`);
    } catch {
      // silently ignore — user stays on current page
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
          <span className="text-xs font-bold text-primary-foreground">N</span>
        </div>
        <span className="font-semibold text-sm">notion.lite</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              pathname === href
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Quick actions */}
      <div className="border-t border-border px-2 py-2">
        <button
          onClick={handleNewPage}
          disabled={creating}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
        >
          {creating
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Plus className="h-4 w-4" />
          }
          New Page
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* User menu at bottom */}
      <UserMenu />
    </aside>
  );
}
