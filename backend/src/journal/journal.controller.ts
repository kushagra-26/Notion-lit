import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto } from './dto/journal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.journalService.findAll(user.id);
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string, @CurrentUser() user: User) {
    return this.journalService.findByDate(user.id, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.journalService.findOne(id, user.id);
  }

  // Upsert — create or update by date
  @Post()
  upsert(@CurrentUser() user: User, @Body() dto: CreateJournalDto) {
    return this.journalService.upsert(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.journalService.remove(id, user.id);
  }
}
