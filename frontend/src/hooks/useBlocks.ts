'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { blocksApi } from '@/lib/api';
import type { Block, BlockType } from '@/types';

const POSITION_GAP = 1000;

function midpoint(a: number, b: number) {
  return (a + b) / 2;
}

export function defaultContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'checklist': return { text: '', checked: false };
    case 'code':      return { code: '', language: 'typescript' };
    default:          return { text: '' };
  }
}

export function useBlocks(pageId: string) {
  const [blocks, setBlocks]       = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Per-block debounce timers for auto-save
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Fetch ───────────────────────────────
  useEffect(() => {
    if (!pageId) return;
    setIsLoading(true);
    blocksApi
      .list(pageId)
      .then((res) => {
        const fetched: Block[] = res.data;
        if (fetched.length === 0) {
          // Seed an initial empty text block for new pages
          blocksApi
            .create(pageId, { type: 'text', content: { text: '' }, position: POSITION_GAP })
            .then((r) => setBlocks([r.data]));
        } else {
          setBlocks(fetched);
        }
      })
      .finally(() => setIsLoading(false));
  }, [pageId]);

  // ─── Create ──────────────────────────────
  const createBlock = useCallback(
    async (type: BlockType = 'text', afterId?: string): Promise<Block> => {
      let position: number | undefined;

      // Compute fractional position by reading current state snapshot
      setBlocks((prev) => {
        const idx    = afterId ? prev.findIndex((b) => b.id === afterId) : prev.length - 1;
        const before = prev[idx];
        const after  = prev[idx + 1];

        if (!before)      position = POSITION_GAP;
        else if (!after)  position = before.position + POSITION_GAP;
        else              position = midpoint(before.position, after.position);

        return prev; // no UI change yet
      });

      if (position === undefined) position = POSITION_GAP;

      const res      = await blocksApi.create(pageId, { type, content: defaultContent(type), position });
      const newBlock: Block = res.data;

      setBlocks((prev) => {
        const idx  = afterId ? prev.findIndex((b) => b.id === afterId) : prev.length - 1;
        const next = [...prev];
        next.splice(idx + 1, 0, newBlock);
        return next;
      });

      return newBlock;
    },
    [pageId],
  );

  // ─── Update content (debounced auto-save) ─
  const updateBlockContent = useCallback(
    (id: string, content: Record<string, unknown>) => {
      // Optimistic local update
      setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));

      const existing = saveTimers.current.get(id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        blocksApi.update(id, { content });
        saveTimers.current.delete(id);
      }, 600);

      saveTimers.current.set(id, timer);
    },
    [],
  );

  // ─── Change type ─────────────────────────
  const changeBlockType = useCallback(async (id: string, type: BlockType) => {
    const content = defaultContent(type);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, type, content } : b)));
    await blocksApi.update(id, { type, content });
  }, []);

  // ─── Delete (empty block) ────────────────
  const deleteBlock = useCallback(async (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    await blocksApi.delete(id);
  }, []);

  // ─── Merge into previous ─────────────────
  /**
   * Called on Backspace at cursor position 0 when block has content.
   * Appends current block's text onto the end of the previous block,
   * then deletes the current block.
   * Returns the previous block id and the cursor position (length of prev text
   * before merge) so the caller can restore focus correctly.
   */
  const mergeIntoPrev = useCallback(
    async (id: string): Promise<{ prevId: string; cursorAt: number } | null> => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx <= 0) return null;

      const prev = blocks[idx - 1];
      const curr = blocks[idx];

      const prevText  = String(prev.content.text ?? '');
      const currText  = String(curr.content.text ?? '');
      const cursorAt  = prevText.length;
      const merged    = { ...prev.content, text: prevText + currText };

      // Optimistic: update prev + remove curr
      setBlocks((bs) =>
        bs
          .map((b) => (b.id === prev.id ? { ...b, content: merged } : b))
          .filter((b) => b.id !== id),
      );

      await Promise.all([
        blocksApi.update(prev.id, { content: merged }),
        blocksApi.delete(id),
      ]);

      return { prevId: prev.id, cursorAt };
    },
    [blocks],
  );

  // ─── Adjacent block ids ──────────────────
  const getAdjacentIds = useCallback(
    (id: string) => {
      const idx = blocks.findIndex((b) => b.id === id);
      return {
        prevId: idx > 0 ? blocks[idx - 1].id : null,
        nextId: idx < blocks.length - 1 ? blocks[idx + 1].id : null,
      };
    },
    [blocks],
  );

  // Flush pending saves on unmount
  const flushSaves = useCallback(() => {
    saveTimers.current.forEach((timer, id) => {
      clearTimeout(timer);
      const block = blocks.find((b) => b.id === id);
      if (block) blocksApi.update(id, { content: block.content });
    });
    saveTimers.current.clear();
  }, [blocks]);

  useEffect(() => () => { flushSaves(); }, [flushSaves]);

  return {
    blocks,
    isLoading,
    createBlock,
    updateBlockContent,
    changeBlockType,
    deleteBlock,
    mergeIntoPrev,
    getAdjacentIds,
  };
}
