# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.4, Inertia.js v2 (server adapter)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Inertia.js v2 (React adapter)
- **Testing:** Pest v4
- **AI Integration:** Ollama (gemma3:4b model) via `App\Services\AiService`
- **Route Generation:** Laravel Wayfinder (auto-generates TS route helpers in `resources/js/actions/` and `resources/js/routes/`)
- **Code Style:** Laravel Pint (preset: laravel)

## Common Commands

```bash
# Development server (runs artisan serve, queue, pail logs, and vite concurrently)
composer run dev

# Build frontend assets
npm run build

# Run all tests (clears config, lint check, then test suite)
composer run test

# Run tests directly
php artisan test --compact

# Run a single test by name
php artisan test --compact --filter=testName

# PHP code formatting (fix)
vendor/bin/pint --dirty

# TypeScript/JS linting and formatting
npm run lint          # ESLint with auto-fix
npm run format        # Prettier
npm run types         # TypeScript type checking

# Create a new test
php artisan make:test --pest SomeTest        # Feature test
php artisan make:test --pest --unit SomeTest # Unit test
```

## Architecture

### CQRS + Event Sourcing Pattern

The core feature (AI content generation) uses a custom CQRS + Event Sourcing implementation in `app/CQRS/`:

- **Commands** (`app/CQRS/Commands/`) — Write-side intent objects dispatched via `CommandBus`
- **Queries** (`app/CQRS/Queries/`) — Read-side queries dispatched via `QueryBus`
- **Handlers** (`app/CQRS/Handlers/`) — Process commands and queries
- **Events** (`app/CQRS/Events/`) — Domain events (`ContentGenerationRequested`, `Completed`, `Failed`)
- **EventStore** (`app/CQRS/EventStore/`) — Persists domain events to `domain_events` table
- **Projections** (`app/CQRS/Projections/`) — `ContentGenerationProjector` listens to events and updates the `content_generations` read model

Registered in `CQRSServiceProvider`.

### Request Flow

1. **Command path:** POST → `ContentCommandController` → `CommandBus` → Handler → Events → EventStore + Projector
2. **Query path:** GET → `ContentQueryController` → `QueryBus` → Handler → reads `content_generations` table → Inertia render
3. **Streaming path:** POST → `ContentStreamController` → `AiService` SSE stream → chunked response with concurrent event persistence

### Frontend

- Pages in `resources/js/pages/` (Inertia convention)
- Wayfinder-generated route helpers in `resources/js/actions/` and `resources/js/routes/` (auto-generated, do not edit)
- Entry points: `app.tsx` (client), `ssr.tsx` (SSR)

### Key Configuration

- `bootstrap/app.php` — Middleware, routing, exceptions (Laravel 12 style, no Kernel.php)
- `bootstrap/providers.php` — AppServiceProvider, CQRSServiceProvider
- Tests use in-memory SQLite (`phpunit.xml`)

## Conventions

- Use `php artisan make:*` commands to create new files; pass `--no-interaction`
- Use Form Request classes for validation (not inline)
- Use constructor property promotion for dependency injection
- Always add explicit return types and parameter type hints
- Run `vendor/bin/pint --dirty` before finalizing PHP changes
- Prefer Eloquent over raw DB queries; use eager loading to prevent N+1
- Use `config()` helper instead of `env()` outside config files
