import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) throw new ConflictException('Email or username already taken');
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.repo.save(this.repo.create({ ...dto, password: hashed }));
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async updateProfile(
    id: string,
    data: { username?: string; email?: string; avatarUrl?: string },
  ): Promise<User> {
    // Check uniqueness if username/email is being changed
    if (data.username || data.email) {
      const conflict = await this.repo
        .createQueryBuilder('u')
        .where('u.id != :id', { id })
        .andWhere(
          data.username && data.email
            ? '(u.username = :username OR u.email = :email)'
            : data.username
            ? 'u.username = :username'
            : 'u.email = :email',
          { username: data.username, email: data.email },
        )
        .getOne();
      if (conflict) throw new ConflictException('Username or email already taken');
    }
    await this.repo.update(id, {
      ...(data.username && { username: data.username }),
      ...(data.email && { email: data.email }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    });
    return this.repo.findOne({ where: { id } }) as Promise<User>;
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.repo.update(id, { password: hashed });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
