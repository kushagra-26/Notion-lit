import { Controller, Get, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /** GET /github/profile — authenticated user's GitHub profile */
  @Get('profile')
  getProfile() {
    return this.githubService.getProfile();
  }

  /** GET /github/repos — 10 most recently updated repos */
  @Get('repos')
  getRepos() {
    return this.githubService.getRepos();
  }

  /** GET /github/activity — 20 most recent public events */
  @Get('activity')
  getActivity() {
    return this.githubService.getActivity();
  }
}
