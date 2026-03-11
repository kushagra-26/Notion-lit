import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Page } from '../pages/page.entity';
import { Task } from '../tasks/task.entity';

export interface SearchResultItem {
  id: string;
  type: 'page' | 'task';
  title: string;
  subtitle?: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Page) private readonly pages: Repository<Page>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {}

  async search(query: string, userId: string): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();

    const [pages, tasks] = await Promise.all([
      this.pages.find({
        where: [{ userId, isDeleted: false, title: ILike(`%${q}%`) }],
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
      this.tasks
        .createQueryBuilder('task')
        .where('task.user_id = :userId', { userId })
        .andWhere(
          '(task.title ILIKE :q OR task.description ILIKE :q)',
          { q: `%${q}%` },
        )
        .orderBy('task.updated_at', 'DESC')
        .take(5)
        .getMany(),
    ]);

    const pageResults: SearchResultItem[] = pages.map((p) => ({
      id: p.id,
      type: 'page',
      title: p.title || 'Untitled',
      subtitle: p.icon ?? '📄',
      url: `/notes/${p.id}`,
    }));

    const taskResults: SearchResultItem[] = tasks.map((t) => ({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: t.status.replace('_', ' '),
      url: `/tasks`,
    }));

    return [...pageResults, ...taskResults];
  }
}
