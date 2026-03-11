/**
 * BlockRenderer — read-only rendering of a single block.
 * Used for previews, exports, and any context where editing is disabled.
 */
import type { Block } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  block: Block;
  className?: string;
}

export function BlockRenderer({ block, className }: Props) {
  const { type, content } = block;
  const text = String(content.text ?? '');

  switch (type) {
    case 'heading1':
      return (
        <h1 className={cn('text-3xl font-bold tracking-tight', className)}>
          {text || <span className="text-muted-foreground">Heading 1</span>}
        </h1>
      );

    case 'heading2':
      return (
        <h2 className={cn('text-2xl font-semibold tracking-tight', className)}>
          {text || <span className="text-muted-foreground">Heading 2</span>}
        </h2>
      );

    case 'heading3':
      return (
        <h3 className={cn('text-xl font-medium', className)}>
          {text || <span className="text-muted-foreground">Heading 3</span>}
        </h3>
      );

    case 'checklist':
      return (
        <div className={cn('flex items-start gap-2', className)}>
          <input
            type="checkbox"
            checked={Boolean(content.checked)}
            readOnly
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
          />
          <span
            className={cn(
              'text-sm leading-relaxed',
              (content as any)?.checked && 'text-muted-foreground line-through',
            )}
          >
            {text}
          </span>
        </div>
      );

    case 'code':
      return (
        <pre
          className={cn(
            'overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-sm',
            className,
          )}
        >
          <code className="text-green-600 dark:text-green-400">
            {String(content.code ?? '')}
          </code>
        </pre>
      );

    case 'quote':
      return (
        <blockquote
          className={cn(
            'border-l-2 border-foreground/30 pl-4 italic text-muted-foreground text-sm leading-relaxed',
            className,
          )}
        >
          {text}
        </blockquote>
      );

    case 'divider':
      return <hr className={cn('border-border my-1', className)} />;

    default:
      return (
        <p className={cn('text-sm leading-relaxed', className)}>
          {text}
        </p>
      );
  }
}
