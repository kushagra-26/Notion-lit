import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GithubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  url: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  isPrivate: boolean;
}

export interface GithubEvent {
  id: string;
  type: string;
  repoName: string;
  message: string;
  createdAt: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class GithubService {
  private readonly CACHE_TTL = 1 * 60 * 60 * 1000;

  private profileCache: CacheEntry<GithubProfile> | null = null;
  private reposCache: CacheEntry<GithubRepo[]> | null = null;
  private activityCache: CacheEntry<GithubEvent[]> | null = null;

  constructor(private readonly config: ConfigService) {}

  private async githubFetch(url: string): Promise<Response> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers });
  }

  async getProfile(): Promise<GithubProfile | null> {
    if (!this.config.get<string>('GITHUB_TOKEN')) return null;
    if (this.profileCache && Date.now() - this.profileCache.timestamp < this.CACHE_TTL) {
      return this.profileCache.data;
    }
    try {
      const res = await this.githubFetch('https://api.github.com/user');
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const raw = (await res.json()) as {
        login: string; name: string | null; avatar_url: string; bio: string | null;
        public_repos: number; followers: number; following: number; html_url: string;
      };
      const profile: GithubProfile = {
        login: raw.login, name: raw.name, avatarUrl: raw.avatar_url,
        bio: raw.bio, publicRepos: raw.public_repos, followers: raw.followers,
        following: raw.following, url: raw.html_url,
      };
      this.profileCache = { data: profile, timestamp: Date.now() };
      return profile;
    } catch {
      return this.profileCache?.data ?? null;
    }
  }

  async getRepos(): Promise<GithubRepo[]> {
    if (!this.config.get<string>('GITHUB_TOKEN')) return [];
    if (this.reposCache && Date.now() - this.reposCache.timestamp < this.CACHE_TTL) {
      return this.reposCache.data;
    }
    try {
      const res = await this.githubFetch('https://api.github.com/user/repos?sort=updated&per_page=10');
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const raw = (await res.json()) as Array<{
        id: number; name: string; full_name: string; description: string | null;
        html_url: string; stargazers_count: number; forks_count: number;
        language: string | null; updated_at: string; private: boolean;
      }>;
      const repos = raw.map((r) => ({
        id: r.id, name: r.name, fullName: r.full_name, description: r.description,
        url: r.html_url, stars: r.stargazers_count, forks: r.forks_count,
        language: r.language, updatedAt: r.updated_at, isPrivate: r.private,
      }));
      this.reposCache = { data: repos, timestamp: Date.now() };
      return repos;
    } catch {
      return this.reposCache?.data ?? [];
    }
  }

  async getActivity(): Promise<GithubEvent[]> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const username = this.config.get<string>('GITHUB_USERNAME');
    if (!token || !username) return [];
    if (this.activityCache && Date.now() - this.activityCache.timestamp < this.CACHE_TTL) {
      return this.activityCache.data;
    }
    try {
      const res = await this.githubFetch(`https://api.github.com/users/${username}/events?per_page=20`);
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const raw = (await res.json()) as Array<{
        id: string; type: string; repo: { name: string };
        payload: Record<string, unknown>; created_at: string;
      }>;
      const events = raw.map((e) => ({
        id: e.id, type: e.type, repoName: e.repo.name,
        message: this.extractEventMessage(e.type, e.payload),
        createdAt: e.created_at,
      }));
      this.activityCache = { data: events, timestamp: Date.now() };
      return events;
    } catch {
      return this.activityCache?.data ?? [];
    }
  }

  private extractEventMessage(type: string, payload: Record<string, unknown>): string {
    switch (type) {
      case 'PushEvent': {
        const commits = payload['commits'] as Array<{ message: string }> | undefined;
        return commits?.[0]?.message ?? 'Pushed commits';
      }
      case 'PullRequestEvent': {
        const pr = payload['pull_request'] as { title?: string } | undefined;
        const action = (payload['action'] as string) ?? 'updated';
        return `${action} PR: ${pr?.title ?? ''}`.trim();
      }
      case 'IssuesEvent': {
        const issue = payload['issue'] as { title?: string } | undefined;
        const action = (payload['action'] as string) ?? 'updated';
        return `${action} issue: ${issue?.title ?? ''}`.trim();
      }
      case 'CreateEvent': {
        const refType = payload['ref_type'] as string | undefined;
        const ref = payload['ref'] as string | undefined;
        return ref ? `Created ${refType ?? 'ref'}: ${ref}` : `Created ${refType ?? 'ref'}`;
      }
      default:
        return type.replace('Event', '');
    }
  }
}
