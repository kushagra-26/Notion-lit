import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../pages/page.entity';
import { Task } from '../tasks/task.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Task])],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
