# Skill: API Integration

Connect external APIs to the application.

## Supported Integrations

- **Stock APIs** — price, change, watchlist data
- **HackerNews API** — developer news
- **Dev.to** — developer articles
- **Reddit programming** — community posts
- **GitHub API** — repos, commits, issues, pull requests

## Guidelines

- Abstract each integration behind a service class
- Handle errors and rate limits gracefully
- Cache responses to reduce redundant external calls
- Normalize external data into consistent internal DTOs
- Store credentials in environment variables, never in code
