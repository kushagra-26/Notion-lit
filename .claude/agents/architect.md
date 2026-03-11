# Architect Agent

## Responsibilities

- System architecture
- Database design
- API structure
- Module boundaries

## Guidelines

- Design PostgreSQL schemas following the block-based architecture
- Define clear module boundaries between Notes, Tasks, Kanban, Habits, Journal, Learning, Stocks, News, and GitHub modules
- Use the block schema pattern for flexible, nested content:

```
blocks
  id
  page_id
  type
  content
  position
  parent_block_id
```

- Structure the database around these core tables:
  - users
  - pages
  - blocks
  - tasks
  - habits
  - journal_entries
  - stocks
  - news
  - learning_progress

## Block Architecture

Everything is a block. Pages contain blocks. Blocks can be nested.

Block types:
- text
- heading
- checklist
- code
- image
- table

Hierarchy:
```
Page
 ├ text block
 ├ checklist block
 ├ code block
 └ image block
```
