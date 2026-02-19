# Project Rules & Guidelines

## 1. Tech Stack Requirements
- **Framework**: SvelteKit (Svelte 5)
- **Language**: TypeScript (`strict: true`, no `any`, no `// @ts-ignore`)
- **Styling**: SCSS Modules (`*.module.scss`) only. No global CSS except reset/variables.
- **State/Persistence**: IndexedDB (via `idb`) for data, Svelte 5 Runes for local state.
- **Validation**: Zod.

## 2. Code Quality
- **Functions**: Small, pure where possible.
- **Components**: Composition over inheritance. Props interface defined via `$Props()`.
- **Linting**: No ESLint warnings allowed. Prettier must be applied.

## 3. UI/UX
- **Performance**: Instant interactions (Used Optimistic UI updates).
- **Accessibility**: Keyboard navigable, clear ARIA labels.

## 4. Architecture
- **Domain Layer**: `src/lib/domain` for Types/Enums.
- **Data Layer**: `src/lib/db` for IndexedDB logic.
- **Validation**: `src/lib/validation` for Zod schemas.
- **Features**: Group code by feature where sensible.

## 5. Deployment
- **Target**: GitHub Pages (Static Adapter).
- **Base Path**: `/Mitarbeiter-Tracking` (must be configurable via `BASE_PATH`).
- **Docker**: Must be buildable via Dockerfile.
- **Git**: Push to `https://github.com/Cking02072001/Mitarbeiter-Tracking.git`
