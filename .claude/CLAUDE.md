# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for querying police incident data. It's a "chat-with-data" system that combines:

- AI-powered chat interface using Vercel AI SDK
- PostgreSQL database via Drizzle ORM
- Police incident management system

## Tech Stack

- **Framework**: Next.js 16 (beta) with App Router, Turbopack, and React Compiler
- **Runtime**: Bun (package manager and runtime)
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS v4, shadcn/ui components (New York style)
- **AI**: Vercel AI SDK with OpenRouter integration
- **Testing**: Vitest, Evalite (for AI evaluations)
- **TypeScript**: Strict mode enabled

## Development Commands

```bash
# Development server (with Turbopack)
bun run dev

# Production build (with Turbopack)
bun run build

# Start production server
bun run start

# Linting
bun run lint

# Database operations
bun run db:generate    # Generate migrations from schema
bun run db:migrate     # Run migrations programmatically
bun run db:seed        # Seed database (requires DB_SEEDING=true)
bun run db:studio      # Open Drizzle Studio (database GUI)
bun run db:push        # Push schema changes directly (dev only)
bun run db:pull        # Pull schema from database
bun run db:check       # Check for schema issues
bun run db:up          # Apply migrations

# AI evaluation (using Evalite)
bun run eval:dev       # Watch mode for AI evaluations
```

## Environment Setup

Required environment variables (see .env.example):

- `DATABASE_URL`: PostgreSQL connection string
- `AI_GATEWAY_API_KEY`: API key for AI Gateway

## Architecture

### Database Schema (lib/db/schemas/)

**Police Schema** (`lib/db/schemas/police.ts`):

- Reference tables: `provincesTable`, `districtsTable`, `incidentTypesTable`, `caseStatusesTable`
- Entity tables for police incident management

**Key Patterns**:

- All tables include `lifecycleDates` mixin (createdAt, updatedAt) via `lib/db/schemas/utils.ts`
- Custom ID generation using typed prefixes (see lib/id.ts)

### Database Connection & Configuration

- **Connection**: `lib/db/index.ts` - Uses `node-postgres` Pool with Drizzle ORM
- **Config**: `drizzle.config.ts` - Points to `lib/db/schemas` directory
- **Migrations**: Stored in `lib/db/migrations/`, run via `lib/db/migrate.ts`
- **Seeding**: `lib/db/seed.ts` orchestrates seeding (requires `DB_SEEDING=true`)
  - `lib/db/police-seed.ts` - Police data
  - `lib/db/seeds/` - Contains CSV data files

### ID Generation (lib/id.ts)

Custom ID generator using nanoid with typed prefixes:

- **Police prefixes**: investigator, incidentReport
- Configurable length and separator
- Example: `generateId("investigator", { length: 5 })` → "inv_a1b2c"

### AI Architecture (lib/ai/)

**Structure**:

- `lib/ai/base-context.ts` - Provides current date/time and timezone to all AI prompts
- `lib/ai/openrouter.ts` - OpenRouter provider configuration
- `lib/ai/police/` - Police incident queries

**Police AI Pipeline** (`lib/ai/police/`):

1. **Classifier** (`classifier.ts`) - Routes user queries to appropriate agent
2. **Agents** (`agents/` directory):
   - `general/` - Handles conversational queries
   - `information/` - Handles data retrieval queries
3. **Query Pipeline** (for information agent):
   - `query-planner.ts` - Plans SQL query approach
   - `sql-generator.ts` - Generates SQL from plan
   - `query-executor.ts` - Executes validated SQL
   - `result-synthesizer.ts` - Formats results for user
   - `chart-generator.ts` - Creates visualizations
4. **Prompts** (`prompts.ts`) - System prompts for each component
5. **Schema** (`schema.ts`) - Zod schemas for AI responses
6. **Evaluations** (`evals/` directory) - Evalite test cases

### API Routes

- `app/api/chat/police/route.ts` - Police queries endpoint

**Pattern**:

- POST endpoint with streaming response
- Uses Vercel AI SDK's `createUIMessageStream`
- Integrates Langfuse for tracing
- Classifies query → routes to agent → executes → synthesizes response

### UI Structure

- **App Router**: `app/` directory with page routes
  - `app/police/page.tsx` - Police chat interface
  - `app/layout.tsx` - Root layout
  - `app/page.tsx` - Home page
- **Components**:
  - `components/chat/` - Chat UI components
  - `components/ai-elements/` - AI-specific UI from ai-sdk registry
  - `components/ui/` - shadcn/ui components (New York style)
- **Aliases** (configured in `components.json` and `tsconfig.json`):
  - `@/components` → components directory
  - `@/lib` → lib directory
  - `@/*` → repository root
- **Styling**: Tailwind CSS v4 with PostCSS integration

### Utilities (lib/)

- `lib/utils.ts` - General utilities (cn, message helpers, SQL validation, CSV conversion)
- `lib/types.ts` - Shared TypeScript types
- `lib/logger.ts` - Logging utilities (using Pino)
- `lib/langfuse.ts` - Langfuse tracing integration
- `lib/rechart-format.ts` - Chart formatting utilities

## Special Configurations

- **React Compiler**: Enabled (`reactCompiler: true` in next.config.ts)
- **Turbopack**: Used for both dev and build
- **TypeScript**: Strict mode enabled
- **Markdown Files**: Configured to load as raw text (both webpack and turbopack)
- **shadcn/ui**: Style "new-york", base color neutral

## Safety Rules

- Use `trash` CLI instead of `rm -rf` for file deletion (recoverable from trash)
- When browser interaction needed (testing UI, inspecting pages, filling forms), use `agent-browser` CLI - a low-context browser automation tool that works via Bash commands

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Code Style Guidelines

### TypeScript

- PascalCase: interfaces, types, classes, components
- camelCase: functions, variables, methods
- SCREAMING_SNAKE_CASE: constants
- kebab-case: file names
- NO `any` without justification; prefer `unknown`
- Use named exports, not default exports
- Import order: external → internal → relative

### React/Frontend

- Use `@/` import alias for project imports
- Event handlers: prefix with "handle" (e.g., `handleClick`)
- Use `const` arrow functions with types
- Early returns for readability
- Tailwind for all styling; no CSS files
- Line length: prefer < 120 characters

## Development Workflow

1. **Schema Changes**:
   - Modify schema files in `lib/db/schemas/`
   - Run `bun run db:generate` to create migration
   - Review migration in `lib/db/migrations/`
   - Run `bun run db:migrate` to apply

2. **Adding New ID Types**:
   - Add prefix to `prefixes` object in `lib/id.ts`
   - Use in schema: `.$defaultFn(() => generateId("yourPrefix", { length: 5 }))`

3. **Adding AI Capabilities**:
   - Define prompts in `lib/ai/police/prompts.ts`
   - Implement query pipeline components as needed
   - Add evaluation cases in `lib/ai/police/evals/` directory
   - Test with `bun run eval:dev`

4. **Adding UI Components**:
   - Use shadcn CLI: `npx shadcn@latest add [component]`
   - Components install to `components/ui/`
   - Custom components go in `components/`
