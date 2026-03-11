import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PagesModule } from './pages/pages.module';
import { BlocksModule } from './blocks/blocks.module';
import { TasksModule } from './tasks/tasks.module';
import { NewsModule } from './news/news.module';
import { HabitsModule } from './habits/habits.module';
import { JournalModule } from './journal/journal.module';
import { LearningModule } from './learning/learning.module';
import { StocksModule } from './stocks/stocks.module';
import { GithubModule } from './github/github.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
 TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: config.get('NODE_ENV') !== 'production',
    logging: false,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  inject: [ConfigService],
}),
    // Feature modules
    AuthModule,
    UsersModule,
    PagesModule,
    BlocksModule,
    TasksModule,
    NewsModule,
    HabitsModule,
    JournalModule,
    LearningModule,
    StocksModule,
    GithubModule,
    AiModule,
    SearchModule,
  ],
})
export class AppModule {}
