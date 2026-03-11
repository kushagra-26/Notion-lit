# Data Integration Agent

## Responsibilities

- Stock API integration
- News feeds
- GitHub API integration

## External APIs

- **Stock APIs** — fetch price, change, and watchlist data
- **HackerNews API** — developer news aggregation
- **Dev.to** — developer articles feed
- **Reddit programming** — community news feed
- **GitHub API** — repositories, commits, issues, pull requests

## Guidelines

- Handle API rate limits gracefully
- Cache responses where appropriate to reduce external calls
- Normalize data from different sources into consistent internal formats
- Store fetched data in the relevant database tables (stocks, news)
