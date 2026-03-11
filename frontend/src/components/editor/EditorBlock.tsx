'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { CheckSquare } from 'lucide-react';
import { SlashMenu, type SlashMenuHandle } from './SlashMenu';
import { BlockToolbar } from './BlockToolbar';
import type { Block, BlockType } from '@/types';
import { cn } from '@/lib/utils';

// ─── Props ───────────────────────────────

interface Props {
  block: Block;
  isFocused: boolean;
  cursorAt?: number; // if set, place cursor here on focus (used after merge)
  onFocus: () => void;
  onChange: (content: Record<string, unknown>) => void;
  onTypeChange: (type: BlockType) => void;
  onEnter: () => void;
  onBackspace: () => void;         // empty block → delete
  onMerge: () => void;              // non-empty at pos-0 → merge into prev
  onAddBelow: () => void;
  onFocusPrev: () => void;
  onFocusNext: () => void;
  onConvertToTask: (text: string) => void;
}

// ─── Component ───────────────────────────

export function EditorBlock({
  block,
  isFocused,
  cursorAt,
  onFocus,
  onChange,
  onTypeChange,
  onEnter,
  onBackspace,
  onMerge,
  onAddBelow,
  onFocusPrev,
  onFocusNext,
  onConvertToTask,
}: Props) {
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef  = useRef<SlashMenuHandle>(null);

  const [showSlash,   setShowSlash]   = useState(false);
  const [slashQuery,  setSlashQuery]  = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [taskDone,    setTaskDone]    = useState(false); // feedback after convert

  // ─── Focus management ─────────────────
  useEffect(() => {
    if (!isFocused || !inputRef.current) return;
    inputRef.current.focus();
    const pos = cursorAt ?? inputRef.current.value.length;
    inputRef.current.setSelectionRange(pos, pos);
  }, [isFocused, cursorAt]);

  // ─── Auto-resize textarea ─────────────
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [block.content]);

  // ─── Helpers ──────────────────────────
  const getText = () => String(block.content.text ?? '');

  const closeSlash = useCallback(() => {
    setShowSlash(false);
    setSlashQuery('');
  }, []);

  // ─── Keyboard handler ─────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const { value, selectionStart, selectionEnd } = e.currentTarget;

      // ── When slash menu is open, route nav keys to it ──
      if (showSlash) {
        if (e.key === 'ArrowUp')   { e.preventDefault(); slashMenuRef.current?.moveUp();   return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); slashMenuRef.current?.moveDown(); return; }
        if (e.key === 'Enter')     { e.preventDefault(); slashMenuRef.current?.confirm();  return; }
        if (e.key === 'Escape')    { closeSlash(); return; }
      }

      switch (e.key) {
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
          break;

        case 'Backspace':
          if (value === '') {
            e.preventDefault();
            onBackspace();
          } else if (selectionStart === 0 && selectionEnd === 0) {
            // Cursor at position 0 with content → merge into previous block
            e.preventDefault();
            onMerge();
          }
          break;

        case 'ArrowUp':
          if (selectionStart === 0 && selectionEnd === 0) {
            e.preventDefault();
            onFocusPrev();
          }
          break;

        case 'ArrowDown':
          if (selectionStart === value.length) {
            e.preventDefault();
            onFocusNext();
          }
          break;

        case 'Escape':
          closeSlash();
          break;
      }
    },
    [showSlash, closeSlash, onEnter, onBackspace, onMerge, onFocusPrev, onFocusNext],
  );

  // ─── Text change handler ──────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;

      // Open slash menu when user types just '/' in an otherwise empty textarea
      if (text === '/') {
        setShowSlash(true);
        setSlashQuery('');
        onChange({ ...block.content, text });
        return;
      }

      // Update slash query as user continues typing after '/'
      if (showSlash) {
        if (text.startsWith('/')) {
          setSlashQuery(text.slice(1));
          onChange({ ...block.content, text });
          return;
        }
        // User deleted the '/' — close menu
        closeSlash();
      }

      onChange({ ...block.content, text });
    },
    [block.content, onChange, showSlash, closeSlash],
  );

  // ─── Slash menu selection ─────────────
  const handleTypeSelect = useCallback(
    (type: BlockType) => {
      closeSlash();
      onChange({ text: '' });
      onTypeChange(type);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [closeSlash, onChange, onTypeChange],
  );

  // ─── Checkbox change ──────────────────
  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onChange({ ...block.content, checked });
    },
    [block.content, onChange],
  );

  // ─── Convert checklist to task ────────
  const handleConvertToTask = useCallback(() => {
    onConvertToTask(getText());
    setTaskDone(true);
    setTimeout(() => setTaskDone(false), 2000);
  }, [onConvertToTask, getText]);

  // ─── Render ───────────────────────────
  const isActive = isFocused;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-1 rounded-sm px-2 py-0.5 transition-colors',
        isActive && 'bg-accent/30',
      )}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Toolbar (drag / add / type badge / delete) */}
      <BlockToolbar
        blockType={block.type}
        visible={showToolbar}
        onDelete={onBackspace}
        onAddBelow={onAddBelow}
      />

      {/* Input area */}
      <div className="relative flex-1 min-w-0">
        {block.type === 'checklist' ? (
          <ChecklistInput
            ref={inputRef}
            text={getText()}
            checked={Boolean(block.content.checked)}
            taskDone={taskDone}
            onFocus={onFocus}
            onChange={(text) => onChange({ ...block.content, text })}
            onCheckChange={handleCheckboxChange}
            onKeyDown={handleKeyDown}
            onConvertToTask={handleConvertToTask}
          />
        ) : block.type === 'divider' ? (
          <div className="py-3">
            <hr className="border-border" />
          </div>
        ) : (
          <textarea
            ref={inputRef}
            value={getText()}
            placeholder={getPlaceholder(block.type, showSlash)}
            onFocus={onFocus}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/40',
              getTextStyle(block.type),
            )}
          />
        )}

        {/* Slash command menu */}
        {showSlash && (
          <SlashMenu
            ref={slashMenuRef}
            query={slashQuery}
            onSelect={handleTypeSelect}
            onClose={closeSlash}
          />
        )}
      </div>
    </div>
  );
}

// ─── Checklist input sub-component ───────

interface ChecklistInputProps {
  ref: React.RefObject<HTMLTextAreaElement | null>;
  text: string;
  checked: boolean;
  taskDone: boolean;
  onFocus: () => void;
  onChange: (text: string) => void;
  onCheckChange: (checked: boolean) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onConvertToTask: () => void;
}

function ChecklistInput({
  ref,
  text,
  checked,
  taskDone,
  onFocus,
  onChange,
  onCheckChange,
  onKeyDown,
  onConvertToTask,
}: ChecklistInputProps) {
  return (
    <div className="group/checklist flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
      />
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={text}
        placeholder="To-do"
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 leading-relaxed',
          checked && 'text-muted-foreground line-through',
        )}
      />

      {/* Convert to task button — shown on hover when there's text */}
      {text.trim() && (
        <button
          tabIndex={-1}
          onClick={onConvertToTask}
          title="Convert to Task"
          className={cn(
            'mt-0.5 flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all',
            taskDone
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'opacity-0 group-hover/checklist:opacity-100 bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <CheckSquare className="h-3 w-3" />
          {taskDone ? 'Added!' : '→ Task'}
        </button>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────

function getPlaceholder(type: BlockType, slashOpen: boolean): string {
  if (slashOpen) return 'Type to filter…';
  switch (type) {
    case 'heading1': return 'Heading 1';
    case 'heading2': return 'Heading 2';
    case 'heading3': return 'Heading 3';
    case 'code':     return '// Write code here…';
    case 'quote':    return 'Quote…';
    default:         return "Press '/' for commands";
  }
}

function getTextStyle(type: BlockType): string {
  switch (type) {
    case 'heading1': return 'text-3xl font-bold tracking-tight leading-tight';
    case 'heading2': return 'text-2xl font-semibold tracking-tight leading-snug';
    case 'heading3': return 'text-xl font-medium leading-snug';
    case 'code':
      return 'font-mono text-sm rounded-md bg-muted px-3 py-2 text-green-600 dark:text-green-400';
    case 'quote':
      return 'border-l-2 border-foreground/30 pl-4 italic text-muted-foreground text-sm leading-relaxed';
    default:
      return 'text-sm leading-relaxed';
  }
}
