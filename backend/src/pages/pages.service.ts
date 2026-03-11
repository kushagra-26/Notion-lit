import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './page.entity';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private readonly repo: Repository<Page>,
  ) {}

  findAll(userId: string): Promise<Page[]> {
    return this.repo.find({
      where: { userId, isDeleted: false },
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Page> {
    const page = await this.repo.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['blocks'],
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async create(userId: string, dto: CreatePageDto): Promise<Page> {
    const page = this.repo.create({
      userId,
      title: dto.title || 'Untitled',
      parentId: dto.parentId,
      icon: dto.icon,
    });
    return this.repo.save(page);
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<CreatePageDto>,
  ): Promise<Page> {
    const page = await this.findOne(id, userId);
    Object.assign(page, dto);
    return this.repo.save(page);
  }

  async remove(id: string, userId: string): Promise<void> {
    const page = await this.findOne(id, userId);
    page.isDeleted = true;
    await this.repo.save(page);
  }
}
