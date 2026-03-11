import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('stock_watchlist')
@Unique(['userId', 'symbol'])
export class StockWatchlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
  transformer: {
    to: (value: string) => value.toUpperCase(),
    from: (value: string) => value,
  },
})
symbol: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
