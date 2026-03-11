import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { CreateJournalDto, UpdateJournalDto } from './dto/journal.dto';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly repo: Repository<JournalEntry>,
  ) {}

  // ─── List all entries (summary) ───────────────────────────────
  findAll(userId: string): Promise<JournalEntry[]> {
    return this.repo.find({
      where: { userId },
      order: { date: 'DESC' },
      select: ['id', 'userId', 'date', 'title', 'mood', 'createdAt', 'updatedAt'],
    });
  }

  // ─── Get entry by date ────────────────────────────────────────
  async findByDate(userId: string, date: string): Promise<JournalEntry | null> {
    return this.repo.findOne({ where: { userId, date } });
  }

  // ─── Get single entry ─────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<JournalEntry> {
    const entry = await this.repo.findOne({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  // ─── Create ───────────────────────────────────────────────────
  async create(userId: string, dto: CreateJournalDto): Promise<JournalEntry> {
    const existing = await this.repo.findOne({ where: { userId, date: dto.date } });
    if (existing) throw new ConflictException('Entry for this date already exists');

    const entry = this.repo.create({
      user: { id: userId },
      userId,
      date: dto.date,
      title: dto.title ?? null,
      content: dto.content ?? null,
      mood: dto.mood ?? null,
    });
    return this.repo.save(entry);
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(id: string, userId: string, dto: UpdateJournalDto): Promise<JournalEntry> {
    const entry = await this.repo.findOne({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (dto.title   !== undefined) entry.title   = dto.title   ?? null;
    if (dto.content !== undefined) entry.content = dto.content ?? null;
    if (dto.mood    !== undefined) entry.mood    = dto.mood    ?? null;

    return this.repo.save(entry);
  }

  // ─── Upsert (create or update by date) ───────────────────────
  async upsert(userId: string, dto: CreateJournalDto): Promise<JournalEntry> {
    const existing = await this.repo.findOne({ where: { userId, date: dto.date } });
    if (existing) {
      return this.update(existing.id, userId, dto);
    }
    return this.create(userId, dto);
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.repo.findOne({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    await this.repo.remove(entry);
  }
}
