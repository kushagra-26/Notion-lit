import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

class AddToWatchlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;
}

@UseGuards(JwtAuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  /** GET /stocks/watchlist — full watchlist with live prices */
  @Get('watchlist')
  getWatchlist(@CurrentUser() user: User) {
    return this.stocksService.getWatchlistWithPrices(user.id);
  }

  /** POST /stocks/watchlist — add a symbol */
  @Post('watchlist')
  addToWatchlist(
    @CurrentUser() user: User,
    @Body() body: AddToWatchlistDto,
  ) {
    return this.stocksService.addToWatchlist(user.id, body.symbol);
  }

  /** DELETE /stocks/watchlist/:symbol — remove a symbol */
  @Delete('watchlist/:symbol')
  removeFromWatchlist(
    @Param('symbol') symbol: string,
    @CurrentUser() user: User,
  ) {
    return this.stocksService.removeFromWatchlist(user.id, symbol);
  }

  /** GET /stocks/quote/:symbol — single live quote */
  @Get('quote/:symbol')
  getQuote(@Param('symbol') symbol: string) {
    return this.stocksService.getQuote(symbol);
  }
}
