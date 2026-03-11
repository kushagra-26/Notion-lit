# CLAUDE.md

## Project Overview

This project is a personal productivity platform similar to a lightweight version of Notion.

The system acts as a "Developer Life OS" that combines productivity, knowledge management, and dashboards into one application.

The system includes:

- Notes
- Tasks
- Kanban boards
- Habit tracking
- Journal
- Learning tracker
- Stock watchlist
- Tech news
- GitHub dashboard

This application is primarily for personal use but may support small teams later.

---

# Tech Stack

Frontend
- Next.js
- React
- TailwindCSS
- shadcn/ui

Backend
- NestJS
- REST API

Database
- PostgreSQL

Realtime
- WebSockets

External APIs
- Stock APIs
- HackerNews API
- GitHub API

---

# Core Modules

## Dashboard

The dashboard is the main entry point.

Display:

- today's tasks
- habit progress
- stock watchlist
- tech news
- quick notes

---

## Notes

Rich note system.

Features:

- markdown
- folders
- tags
- search
- backlinks

---

## Tasks

Task manager.

Fields:

- title
- description
- priority
- due_date
- status

---

## Kanban

Visual project boards.

Columns:

- todo
- in_progress
- done

---

## Habits

Habit tracking system.

Tracks:

- streaks
- daily completion

---

## Journal

Daily writing and reflections.

---

## Learning Tracker

Track progress across learning topics.

Example:

- system design
- backend development
- algorithms

---

## Stock Watchlist

Track selected stocks.

Display:

- price
- change
- watchlist

---

## Tech News

Developer news aggregator.

Sources:

- HackerNews
- Dev.to
- Reddit programming

---

## GitHub Dashboard

Display:

- repositories
- commits
- issues
- pull requests

---

# Notion Style Block Architecture

The notes system should follow a block-based architecture similar to Notion.

Everything is a block.

Examples of blocks:

- text block
- heading block
- checklist block
- code block
- image block
- table block

Hierarchy example:

Page
 ├ text block
 ├ checklist block
 ├ code block
 └ image block

Database design example:

users
pages
blocks
tasks
habits
journal_entries
stocks
news
learning_progress

Example block schema:

blocks
id
page_id
type
content
position
parent_block_id

This architecture allows flexible editing and nesting.

---

# Development Phases

Phase 1
- authentication
- dashboard
- notes
- tasks

Phase 2
- kanban
- habits
- journal

Phase 3
- stock tracker
- tech news
- github dashboard

Phase 4
- AI assistant
- productivity automation

---

# Coding Guidelines

1. Use TypeScript.
2. Write modular code.
3. Prefer simple solutions.
4. Use reusable components.
5. Separate UI and business logic.
6. Write clean REST APIs.
7. Document complex functions.

---

# UI Principles

The UI should be:

- minimal
- fast
- keyboard friendly
- distraction free

Design inspiration:

- Notion
- Linear
- Raycast

---

# Agents

Agents are defined in the `agents/` folder. Each agent has a dedicated file with its responsibilities and guidelines.

- `agents/architect.md` — system architecture, DB design, block schema
- `agents/frontend.md` — UI components, layouts, Next.js/Tailwind stack
- `agents/backend.md` — NestJS APIs, auth, business logic
- `agents/debugging.md` — bug diagnosis and runtime fixes
- `agents/devops.md` — Docker, CI/CD, environment config
- `agents/data-integration.md` — Stock, HackerNews, GitHub API integrations
- `agents/ai-assistant.md` — note summarization, task generation, learning plans
- `agents/productivity.md` — habit analysis, priority suggestions, workflow improvements
- `agents/auto-tester.md` — automatic code testing and debugging

---

# Skills

Skills are defined in the `skills/` folder. Each skill has a dedicated file with usage guidelines.

- `skills/code-generation.md` — production-ready TypeScript code
- `skills/schema-design.md` — PostgreSQL schemas with block architecture
- `skills/api-integration.md` — external API connections
- `skills/ui-generation.md` — Tailwind + React components
- `skills/refactoring.md` — code quality improvements
- `skills/testing.md` — unit and integration tests
- `skills/documentation.md` — API and module docs

---

# Command Palette

The system should include a global command palette.

Shortcut:

Ctrl + K

Users can search:

- notes
- tasks
- commands
- pages

---

# Claude Instructions

When generating code:

- use TypeScript
- follow Next.js best practices
- generate clean and readable code
- explain complex logic
- keep APIs consistent
- prioritize maintainability
- use auto-tester.md to test code

Claude should assist with:

- system design
- database schemas
- UI components
- backend APIs
- debugging