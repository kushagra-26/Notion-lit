import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockWatchlist } from './stock-watchlist.entity';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockWatchlist])],
  providers: [StocksService],
  controllers: [StocksController],
})
export class StocksModule {}
