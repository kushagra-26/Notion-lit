'use client';

import { createContext, useContext } from 'react';

interface CommandPaletteContextValue {
  open: () => void;
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);
