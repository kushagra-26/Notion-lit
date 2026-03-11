import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

class AddToWatchlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20) // allow e.g. RELIANCE.NS
  symbol: string;
}

@UseGuards(JwtAuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.stocksService.searchSymbols(q ?? '');
  }

  @Get('watchlist')
  getWatchlist(@CurrentUser() user: User) {
    return this.stocksService.getWatchlistWithPrices(user.id);
  }

  @Post('watchlist')
  addToWatchlist(@CurrentUser() user: User, @Body() body: AddToWatchlistDto) {
    return this.stocksService.addToWatchlist(user.id, body.symbol);
  }

  @Delete('watchlist/:symbol')
  removeFromWatchlist(@Param('symbol') symbol: string, @CurrentUser() user: User) {
    return this.stocksService.removeFromWatchlist(user.id, symbol);
  }

  @Get('quote/:symbol')
  getQuote(@Param('symbol') symbol: string) {
    return this.stocksService.getQuote(symbol);
  }
}
