## Project Overview

This is a Next.js application for managing student data and school operations. It's a "chat-with-data" system that combines:

- AI-powered chat interface using Vercel AI SDK
- PostgreSQL database via Drizzle ORM
- Comprehensive student information system covering academics, health, food services, and library usage

## Tech Stack

- **Framework**: Next.js 16 (beta) with App Router, Turbopack, and React Compiler
- **Runtime**: Bun (package manager and runtime)
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS v4, shadcn/ui components (New York style)
- **AI**: Vercel AI SDK with AI Gateway integration
- **Testing**: Vitest, Evalite (for AI evaluations)
- **TypeScript**: Strict mode enabled with typed routes

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
bun drizzle-kit generate    # Generate migrations from schema
bun drizzle-kit migrate     # Run migrations
bun drizzle-kit studio      # Open Drizzle Studio (database GUI)
bun run lib/db/migrate.ts   # Run migrations programmatically
```

## Environment Setup

Required environment variables (see .env.example):

- `DATABASE_URL`: PostgreSQL connection string
- `AI_GATEWAY_API_KEY`: API key for AI Gateway

## Architecture

### Database Schema (lib/db/schema.ts)

The database models a complete student information system with the following domain areas:

**Core Student Data**:

- `studentsTable`: Student profiles with custom ID generation (5-char format: "stu_xxxxx")
- `guardiansTable`: Parent/guardian information linked to students

**Academic Management**:

- `studyPlansTable`: Academic programs/curricula
- `enrollmentsTable`: Student enrollment in programs by academic year
- `subjectsTable`: Course catalog with bilingual names
- `academicYearsTable`: Semester definitions with unique year/semester constraints
- `scoringsTable`: Student grades and performance tracking

**Attendance & Health**:

- `leaveTypesTable`: Categories of absences
- `attendancesTable`: Student leave records
- `sicknessTypesTable`: Health condition categories (illness/injury/accident)
- `firstAidRoomsTable`: Medical visits with detailed incident tracking

**Student Services**:

- `foodCategoriesTable`, `foodMenusTable`: Cafeteria menu management
- `foodSourcesTable`: Food service locations (minimart, canteen, online)
- `foodTransactionsTable`: Student purchase history
- `libraryVisitsTable`: Entry/exit tracking with indexed timestamps

**Key Patterns**:

- All tables include `lifecycleDates` mixin (createdAt, updatedAt)
- Student IDs use custom generator (lib/id.ts) with configurable prefixes
- Foreign key relationships maintain referential integrity
- Strategic indexes on high-query columns (e.g., library entry times)

### Database Connection (lib/db/index.ts)

Uses `node-postgres` Pool with Drizzle ORM. Connection string from environment variables. Single pool instance exported for reuse.

### ID Generation (lib/id.ts)

Custom ID generator using nanoid with typed prefixes:

- Supports prefixes: student, scoring, attendance, food, firstAidRoom, libraryVisit
- Configurable length and separator
- Example: `generateId("student", { length: 5 })` → "stu_a1b2c"

### API Routes

- `app/api/chat/route.ts`: AI chat endpoint (currently placeholder - only exports GET handler)

### UI Structure

- Uses Next.js App Router with React Server Components
- Configured for shadcn/ui with component aliases:
  - `@/components` → components directory
  - `@/lib` → lib directory
  - `@/components/ui` → UI components from shadcn
- Tailwind CSS v4 with PostCSS integration
- Path alias `@/*` points to repository root

## Special Configurations

- **React Compiler**: Enabled (`reactCompiler: true` in next.config.ts)
- **Typed Routes**: Next.js typed routes enabled for type-safe navigation
- **Turbopack**: Used for both dev and build
- **Strict TypeScript**: ES2017 target with strict mode
