# Frontend Rules

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with custom design system (`tailwind.config.ts`)
- next-intl for i18n (ja/en)
- React Query (TanStack Query) for data fetching
- Wagmi + RainbowKit for wallet connection

## File Structure
```
src/frontend/web/src/
  app/[locale]/{app}/{screen}/page.tsx   Pages (must be under [locale])
  components/{app}/                       Shared components
  hooks/{app}/                           React Query hooks
  lib/api/{app}/types.ts                 API types (from backend)
  lib/api/{app}/client.ts                API client (axios)
  locales/ja/{app}.json                  Japanese translations
  locales/en/{app}.json                  English translations
```

## i18n Rules
- ALL user-visible text must use `t('key')` from next-intl
- No hardcoded Japanese or English strings in components
- Keys organized by app: `consumer.json`, `prover.json`, etc.
- Tooltip text for technical terms (Dilithium, SPHINCS+, veQS, etc.)

## Component Rules
- Every data component must handle: Loading (Skeleton), Error, Empty states
- Use React Query hooks from `hooks/{app}/`, never fetch in components
- Primary CTA button: max 1 per screen (bg-gradient-hinomaru)
- Tap targets: minimum 44x44px
- Contrast ratio: minimum 4.5:1 (WCAG AA)

## Styling Rules
- Use only classes defined in `tailwind.config.ts`
- CSS Variables defined in `globals.css`
- Forbidden: `border-border`, `duration-250`, or any undefined utility
- Design reference: `docs/design/assets/design-concept-5-japan-premium.html`
- Brand colors: Hinomaru Red (#C41E3A), Gold (#B8860B)

## Data Flow
```
Backend API (JSON, snake_case)
  -> lib/api/{app}/client.ts (axios, camelCase transform)
  -> lib/api/{app}/types.ts (TypeScript interfaces)
  -> hooks/{app}/useXxx.ts (React Query wrapper)
  -> components (useQuery result only)
```

## FORBIDDEN in non-test files
- `DEMO_*` constants
- `FALLBACK_*` constants
- `MOCK_*` constants (except in `mock.ts`)
- Direct API calls in components (use hooks)
- Hardcoded Japanese/English text
