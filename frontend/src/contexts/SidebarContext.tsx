'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile nav)
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
