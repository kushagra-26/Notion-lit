import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningTopic } from './learning-topic.entity';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LearningTopic])],
  providers: [LearningService],
  controllers: [LearningController],
})
export class LearningModule {}
