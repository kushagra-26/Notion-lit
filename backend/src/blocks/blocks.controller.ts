import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, ReorderBlockDto } from './dto/update-block.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  // GET /pages/:pageId/blocks
  @Get('pages/:pageId/blocks')
  findByPage(@Param('pageId') pageId: string) {
    return this.blocksService.findByPage(pageId);
  }

  // POST /pages/:pageId/blocks
  @Post('pages/:pageId/blocks')
  create(@Param('pageId') pageId: string, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(pageId, dto);
  }

  // PATCH /pages/:pageId/blocks/reorder  — bulk position update
  @Patch('pages/:pageId/blocks/reorder')
  reorder(@Body() updates: ReorderBlockDto[]) {
    return this.blocksService.reorder(updates);
  }

  // PATCH /blocks/:id
  @Patch('blocks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.blocksService.update(id, dto);
  }

  // DELETE /blocks/:id
  @Delete('blocks/:id')
  remove(@Param('id') id: string) {
    return this.blocksService.remove(id);
  }
}
