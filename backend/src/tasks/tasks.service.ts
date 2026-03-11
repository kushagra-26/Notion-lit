import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  findAll(userId: string, filters?: { status?: string; priority?: string }): Promise<Task[]> {
    const query = this.repo.createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .orderBy('task.position', 'ASC')
      .addOrderBy('task.createdAt', 'DESC');

    if (filters?.status)   query.andWhere('task.status = :status', { status: filters.status });
    if (filters?.priority) query.andWhere('task.priority = :priority', { priority: filters.priority });

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.repo.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.repo.create({
      // Use relation object so TypeORM resolves the FK correctly
      user: { id: userId },
      title: dto.title,
      description: dto.description,
      priority: (dto.priority ?? 'medium') as TaskPriority,
      dueDate: dto.dueDate,
    });
    return this.repo.save(task);
  }

  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Apply each DTO field with explicit enum casts to satisfy TypeScript
    if (dto.title       !== undefined) task.title       = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority    !== undefined) task.priority    = dto.priority as TaskPriority;
    if (dto.status      !== undefined) task.status      = dto.status as TaskStatus;
    if (dto.dueDate     !== undefined) task.dueDate     = dto.dueDate;

    // Track completion timestamp
    if (dto.status === 'done' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (dto.status && dto.status !== 'done') {
      task.completedAt = null;
    }

    return this.repo.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.repo.remove(task);
  }
}
