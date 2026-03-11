import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Block } from '../blocks/block.entity';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'Untitled' })
  title: string;

  @Column({ nullable: true, length: 10 })
  icon: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => Block, (b) => b.page, { cascade: true })
  blocks: Block[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
