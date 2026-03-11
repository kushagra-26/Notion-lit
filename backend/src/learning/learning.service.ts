import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningTopic } from './learning-topic.entity';
import { CreateLearningTopicDto } from './dto/create-learning-topic.dto';
import { UpdateLearningTopicDto } from './dto/update-learning-topic.dto';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LearningTopic)
    private readonly topicRepo: Repository<LearningTopic>,
  ) {}

  // ─── Find all topics for a user ──────────────────────────────────
  async findAll(userId: string): Promise<LearningTopic[]> {
    return this.topicRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Create a new topic ───────────────────────────────────────────
  async create(userId: string, dto: CreateLearningTopicDto): Promise<LearningTopic> {
    const topic = this.topicRepo.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      progress: dto.progress ?? 0,
      status: dto.status ?? 'active',
      category: dto.category ?? null,
      resources: dto.resources ?? null,
      targetDate: dto.targetDate ?? null,
    });
    return this.topicRepo.save(topic);
  }

  // ─── Update a topic (verify ownership) ───────────────────────────
  async update(
    userId: string,
    id: string,
    dto: UpdateLearningTopicDto,
  ): Promise<LearningTopic> {
    const topic = await this.topicRepo.findOne({ where: { id, userId } });
    if (!topic) throw new NotFoundException('Learning topic not found');

    if (dto.name        !== undefined) topic.name        = dto.name;
    if (dto.description !== undefined) topic.description = dto.description ?? null;
    if (dto.progress    !== undefined) topic.progress    = dto.progress;
    if (dto.status      !== undefined) topic.status      = dto.status;
    if (dto.category    !== undefined) topic.category    = dto.category ?? null;
    if (dto.resources   !== undefined) topic.resources   = dto.resources ?? null;
    if (dto.targetDate  !== undefined) topic.targetDate  = dto.targetDate ?? null;

    return this.topicRepo.save(topic);
  }

  // ─── Delete a topic (verify ownership) ───────────────────────────
  async remove(userId: string, id: string): Promise<void> {
    const topic = await this.topicRepo.findOne({ where: { id, userId } });
    if (!topic) throw new NotFoundException('Learning topic not found');
    await this.topicRepo.remove(topic);
  }
}
