import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Page } from '../pages/page.entity';

export type BlockType =
  | 'text' | 'heading1' | 'heading2' | 'heading3'
  | 'checklist' | 'bulleted_list' | 'numbered_list'
  | 'code' | 'image' | 'divider' | 'quote' | 'callout' | 'toggle';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'page_id' })
  pageId: string;

  @ManyToOne(() => Page, (p) => p.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @Column({ name: 'parent_block_id', nullable: true })
  parentBlockId: string;

  @Column({ type: 'varchar', default: 'text' })
  type: BlockType;

  @Column({ type: 'jsonb', default: {} })
  content: Record<string, unknown>;

  @Column({ type: 'float', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
