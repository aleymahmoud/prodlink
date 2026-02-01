# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProdLink is a factory production data collection PWA for a pastries factory. It tracks production output, waste (with approval workflows), damage, and reprocessing entries across ~20 production lines. Built with Next.js 14, Supabase (auth + PostgreSQL), and Tailwind CSS.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, callback)
│   ├── (dashboard)/       # Main app routes with DashboardLayout
│   ├── admin/             # Admin panel (users, lines, products, reasons, settings)
│   └── api/               # API routes
├── features/              # Feature modules
│   └── auth/              # Auth services and hooks
└── shared/
    ├── components/        # Shared UI components
    ├── i18n/              # Internationalization (en/ar)
    ├── lib/               # Utilities
    │   └── supabase/      # Supabase client configuration
    └── types/             # TypeScript types
```

### Key Patterns

**Supabase Client Usage:**
- Server components: `import { createClient } from '@/shared/lib/supabase/server'` (async)
- Client components: `import { createClient } from '@/shared/lib/supabase/client'`

**Authentication:**
- Middleware (`src/middleware.ts`) handles session refresh via `updateSession()`
- `useUser()` hook provides `user`, `profile`, and `isLoading` state
- First user to sign up automatically becomes admin

**Internationalization:**
- Use `useTranslation()` hook to get `t()` function and `locale`
- Translations in `src/shared/i18n/locales/{en,ar}.json`
- RTL support handled automatically based on locale

**Data Entry Pages:**
- Dashboard routes use `DashboardLayout` wrapper
- Entry forms (production, waste, damage, reprocessing) follow consistent patterns
- Products are linked to production lines via `line_id`

### Database Schema

Core tables in Supabase with RLS policies:
- `profiles` - User accounts (extends auth.users)
- `lines` - Production lines (type: finished/semi-finished)
- `products` - Products linked to lines
- `user_line_assignments` - Maps users to their accessible lines
- `production_entries`, `waste_entries`, `damage_entries`, `reprocessing_entries`
- `reasons` - Configurable reasons by type (waste/damage/reprocessing)
- `approval_levels`, `waste_approvals` - Waste approval workflow

Migrations in `supabase/migrations/`. The first user trigger creates an admin profile.

### User Roles

- `admin` - Full access, system configuration
- `engineer` - Data entry for assigned lines only
- `approver` - View and approve waste entries
- `viewer` - Read-only dashboard access

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
