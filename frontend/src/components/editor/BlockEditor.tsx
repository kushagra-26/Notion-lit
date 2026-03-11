'use client';

import { useCallback, useRef, useState } from 'react';
import { EditorBlock } from './EditorBlock';
import { useBlocks } from '@/hooks/useBlocks';
import { tasksApi } from '@/lib/api';
import type { BlockType } from '@/types';

interface Props {
  pageId: string;
}

interface PendingCursor {
  blockId: string;
  position: number;
}

export function BlockEditor({ pageId }: Props) {
  const {
    blocks,
    isLoading,
    createBlock,
    updateBlockContent,
    changeBlockType,
    deleteBlock,
    mergeIntoPrev,
    getAdjacentIds,
  } = useBlocks(pageId);

  const [focusedId,    setFocusedId]    = useState<string | null>(null);
  const pendingCursor = useRef<PendingCursor | null>(null);

  // ─── Enter: new block below ───────────
  const handleEnter = useCallback(
    async (afterId: string) => {
      const newBlock = await createBlock('text', afterId);
      setFocusedId(newBlock.id);
    },
    [createBlock],
  );

  // ─── Backspace on empty: delete ───────
  const handleBackspace = useCallback(
    async (id: string) => {
      if (blocks.length <= 1) return; // keep at least one block
      const { prevId } = getAdjacentIds(id);
      await deleteBlock(id);
      if (prevId) setFocusedId(prevId);
    },
    [blocks.length, deleteBlock, getAdjacentIds],
  );

  // ─── Backspace at pos-0 with content: merge ─
  const handleMerge = useCallback(
    async (id: string) => {
      const result = await mergeIntoPrev(id);
      if (!result) return;
      // Store cursor position; EditorBlock reads it on next focus
      pendingCursor.current = { blockId: result.prevId, position: result.cursorAt };
      setFocusedId(result.prevId);
    },
    [mergeIntoPrev],
  );

  // ─── Add block below (from toolbar) ──
  const handleAddBelow = useCallback(
    async (afterId: string) => {
      const newBlock = await createBlock('text', afterId);
      setFocusedId(newBlock.id);
    },
    [createBlock],
  );

  // ─── Arrow navigation ─────────────────
  const handleFocusPrev = useCallback(
    (id: string) => {
      const { prevId } = getAdjacentIds(id);
      if (prevId) setFocusedId(prevId);
    },
    [getAdjacentIds],
  );

  const handleFocusNext = useCallback(
    (id: string) => {
      const { nextId } = getAdjacentIds(id);
      if (nextId) setFocusedId(nextId);
    },
    [getAdjacentIds],
  );

  // ─── Type change ──────────────────────
  const handleTypeChange = useCallback(
    (id: string, type: BlockType) => {
      changeBlockType(id, type);
      setFocusedId(id);
    },
    [changeBlockType],
  );

  // ─── Convert checklist item to task ──
  const handleConvertToTask = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      await tasksApi.create({ title: text.trim(), priority: 'medium' });
    } catch {
      // fail silently — the button shows its own feedback state
    }
  }, []);

  // ─── Loading state ────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  // ─── Render ───────────────────────────
  return (
    <div className="flex flex-1 flex-col">
      {blocks.map((block) => {
        // Consume the pending cursor once, for the block that just received focus
        const cursor = pendingCursor.current?.blockId === block.id
          ? pendingCursor.current.position
          : undefined;
        if (cursor !== undefined) pendingCursor.current = null;

        return (
          <EditorBlock
            key={block.id}
            block={block}
            isFocused={focusedId === block.id}
            cursorAt={cursor}
            onFocus={() => setFocusedId(block.id)}
            onChange={(content) => updateBlockContent(block.id, content)}
            onTypeChange={(type) => handleTypeChange(block.id, type)}
            onEnter={() => handleEnter(block.id)}
            onBackspace={() => handleBackspace(block.id)}
            onMerge={() => handleMerge(block.id)}
            onAddBelow={() => handleAddBelow(block.id)}
            onFocusPrev={() => handleFocusPrev(block.id)}
            onFocusNext={() => handleFocusNext(block.id)}
            onConvertToTask={(text) => handleConvertToTask(text)}
          />
        );
      })}

      {/* Clickable empty area below last block creates a new block */}
      <div
        className="min-h-[160px] flex-1 cursor-text"
        onClick={async () => {
          const last     = blocks[blocks.length - 1];
          const newBlock = await createBlock('text', last?.id);
          setFocusedId(newBlock.id);
        }}
      />
    </div>
  );
}
