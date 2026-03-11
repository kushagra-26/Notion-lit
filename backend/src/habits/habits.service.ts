import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { HabitLog } from './habit-log.entity';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';

export interface HabitWithStats extends Habit {
  streak: number;
  completedToday: boolean;
  completedDates: string[];
}

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepo: Repository<Habit>,
    @InjectRepository(HabitLog)
    private readonly logRepo: Repository<HabitLog>,
  ) {}

  // ─── Streak calculation ───────────────────────────────────────
  private calculateStreak(logDates: Set<string>): number {
    let streak = 0;
    const today = new Date();

    // Start from today; if today not completed, start from yesterday
    const startDate = logDates.has(today.toISOString().slice(0, 10))
      ? new Date(today)
      : new Date(today.getTime() - 86400000);

    const cur = new Date(startDate);
    while (true) {
      const dateStr = cur.toISOString().slice(0, 10);
      if (!logDates.has(dateStr)) break;
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  // ─── Find all with stats ──────────────────────────────────────
  async findAll(userId: string): Promise<HabitWithStats[]> {
    const habits = await this.habitRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const today = new Date().toISOString().slice(0, 10);

    return Promise.all(
      habits.map(async (habit) => {
        const logs = await this.logRepo.find({
          where: { habitId: habit.id, userId },
          order: { date: 'DESC' },
        });

        const logDates = new Set(logs.map((l) => l.date));
        return {
          ...habit,
          streak: this.calculateStreak(logDates),
          completedToday: logDates.has(today),
          completedDates: Array.from(logDates),
        };
      }),
    );
  }

  // ─── Create ───────────────────────────────────────────────────
  async create(userId: string, dto: CreateHabitDto): Promise<HabitWithStats> {
    const habit = this.habitRepo.create({
      user: { id: userId },
      userId,
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? '#6366f1',
      icon: dto.icon ?? null,
      frequency: dto.frequency ?? 'daily',
    });
    const saved = await this.habitRepo.save(habit);
    return { ...saved, streak: 0, completedToday: false, completedDates: [] };
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(id: string, userId: string, dto: UpdateHabitDto): Promise<HabitWithStats> {
    const habit = await this.habitRepo.findOne({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');

    if (dto.name        !== undefined) habit.name        = dto.name;
    if (dto.description !== undefined) habit.description = dto.description ?? null;
    if (dto.color       !== undefined) habit.color       = dto.color;
    if (dto.icon        !== undefined) habit.icon        = dto.icon ?? null;
    if (dto.frequency   !== undefined) habit.frequency   = dto.frequency;

    await this.habitRepo.save(habit);
    const [updated] = await this.findAll(userId);
    // Re-fetch single habit with stats
    const all = await this.findAll(userId);
    return all.find((h) => h.id === id)!;
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(id: string, userId: string): Promise<void> {
    const habit = await this.habitRepo.findOne({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    await this.habitRepo.remove(habit);
  }

  // ─── Toggle today's log ───────────────────────────────────────
  async toggleToday(habitId: string, userId: string): Promise<{ completed: boolean; streak: number }> {
    const habit = await this.habitRepo.findOne({ where: { id: habitId, userId } });
    if (!habit) throw new NotFoundException('Habit not found');

    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.logRepo.findOne({ where: { habitId, userId, date: today } });

    if (existing) {
      await this.logRepo.remove(existing);
    } else {
      const log = this.logRepo.create({ habitId, userId, habit: { id: habitId }, date: today });
      await this.logRepo.save(log);
    }

    // Recalculate streak
    const logs = await this.logRepo.find({ where: { habitId, userId }, order: { date: 'DESC' } });
    const logDates = new Set(logs.map((l) => l.date));
    return {
      completed: !existing,
      streak: this.calculateStreak(logDates),
    };
  }
}
