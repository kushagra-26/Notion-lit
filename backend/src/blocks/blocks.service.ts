import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block, BlockType } from './block.entity';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, ReorderBlockDto } from './dto/update-block.dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly repo: Repository<Block>,
  ) {}

  findByPage(pageId: string): Promise<Block[]> {
    return this.repo.find({
      where: { pageId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Block> {
    const block = await this.repo.findOne({ where: { id } });
    if (!block) throw new NotFoundException('Block not found');
    return block;
  }

  async create(pageId: string, dto: CreateBlockDto): Promise<Block> {
    const block = this.repo.create({
      // Use relation object so TypeORM resolves the FK correctly
      page: { id: pageId },
      type: dto.type as BlockType,
      content: dto.content,
      position: dto.position,
      ...(dto.parentBlockId && { parentBlockId: dto.parentBlockId }),
    });
    return this.repo.save(block);
  }

  async update(id: string, dto: UpdateBlockDto): Promise<Block> {
    const block = await this.findOne(id);
    if (dto.content  !== undefined) block.content  = dto.content;
    if (dto.position !== undefined) block.position = dto.position;
    if (dto.type     !== undefined) block.type     = dto.type as BlockType;
    return this.repo.save(block);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.repo.delete(id);
    return { id };
  }

  /**
   * Bulk-update positions — used when blocks are reordered.
   * Runs in a single transaction for consistency.
   */
  async reorder(updates: ReorderBlockDto[]): Promise<void> {
    await this.repo.manager.transaction(async (em) => {
      for (const { id, position } of updates) {
        await em.update(Block, id, { position });
      }
    });
  }
}
