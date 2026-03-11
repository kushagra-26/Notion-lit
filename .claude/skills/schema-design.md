# Skill: Schema Design

Design PostgreSQL schemas for new modules.

## Core Tables

```sql
users
pages
blocks
tasks
habits
journal_entries
stocks
news
learning_progress
```

## Block Schema

```sql
blocks (
  id          UUID PRIMARY KEY,
  page_id     UUID REFERENCES pages(id),
  type        VARCHAR,   -- text | heading | checklist | code | image | table
  content     JSONB,
  position    INTEGER,
  parent_block_id UUID REFERENCES blocks(id)
)
```

## Guidelines

- Use UUIDs for primary keys
- Use JSONB for flexible block content
- Define foreign key constraints
- Add indexes on frequently queried columns (page_id, type, parent_block_id)
- Follow normalization principles while keeping queries efficient
