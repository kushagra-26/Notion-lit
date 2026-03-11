import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.habitsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.habitsService.remove(id, user.id);
  }

  @Post(':id/toggle')
  toggleToday(@Param('id') id: string, @CurrentUser() user: User) {
    return this.habitsService.toggleToday(id, user.id);
  }
}
