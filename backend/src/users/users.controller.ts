import {
  Controller, Get, Patch, Delete, Body, UseGuards,
  BadRequestException, UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { User } from './user.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() body: { username?: string; email?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    const full = await this.usersService.findById(user.id);
    const valid = await bcrypt.compare(body.currentPassword, full!.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    await this.usersService.changePassword(user.id, body.newPassword);
    return { message: 'Password updated successfully' };
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user.id);
    return { message: 'Account deleted' };
  }
}
