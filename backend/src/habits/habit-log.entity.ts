import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Habit } from './habit.entity';

@Entity('habit_logs')
@Unique(['habitId', 'date'])
export class HabitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'habit_id' })
  habitId: string;

  @ManyToOne(() => Habit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Habit;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
