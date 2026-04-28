# AppForge — Architecture Documentation

## Overview

AppForge is a config-driven application platform. It reads a single JSON config file (`config/app.config.json`) and dynamically generates a full-stack web application: database schema, REST APIs, and UI.

---

## Core Systems

### 1. Config Parser & Validator (`lib/config.ts`)

Uses **Zod** to validate the config against a strict schema. Key behaviors:

- Missing keys → filled with safe defaults (e.g., missing `theme` → `"dark"`)
- Unknown keys → logged as warnings, not errors
- Invalid types → coerced or defaulted
- The app **never crashes** due to bad config — it always degrades gracefully

```typescript
// Adding a new config section:
const MyNewSection = z.object({ key: z.string().default('value') });
// Add it to AppConfigSchema and export the type
```

### 2. Schema Generator (`scripts/generate-schema.ts`)

Runs before `dev` and `build` via `predev`/`prebuild` scripts. Reads `app.config.json` and:

1. Maps entity field types to Prisma types (`number → Float`, `string → String`, etc.)
2. Writes `prisma/schema.prisma` with all models + base fields (`id`, `userId`, `createdAt`, `updatedAt`)
3. Runs `prisma db push` to sync the database
4. Runs `prisma generate` to update the Prisma client

**Adding a new field type:**
```typescript
// In scripts/generate-schema.ts, mapType function:
case 'date': return 'DateTime';
// Then handle it in the frontend FieldInput component
```

### 3. Dynamic API Generator (`app/api/entities/[entity]/route.ts`)

A single catch-all route handles CRUD for all entities:

```
GET    /api/entities/:entity       → list all (filtered by userId)
POST   /api/entities/:entity       → create
PUT    /api/entities/:entity/:id   → update
DELETE /api/entities/:entity/:id   → delete
```

All routes:
- Require a valid session (NextAuth JWT)
- Filter records by `userId` (full data isolation)
- Validate against entity field definitions from config
- Return consistent error shapes: `{ error, fields?, detail? }`

### 4. Component Registry (`components/registry.tsx`)

The extensibility core. Maps page type strings to React components:

```typescript
const ComponentRegistry: Record<string, RendererComponent> = {
  table: TableRenderer,
  dashboard: DashboardRenderer,
  // Add new types here ↓
};
```

**Adding a new page type (3 steps):**
1. Create `components/renderers/MyRenderer.tsx`
2. Import it in `components/registry.tsx`
3. Add it: `mytype: MyRenderer`

The dynamic route (`app/[...slug]/page.tsx`) looks up the page in config, finds the renderer in the registry, and renders it. Unknown types render a helpful `FallbackRenderer` — never a blank page.

### 5. Authentication (`lib/auth.ts`)

NextAuth with:
- **CredentialsProvider** (email + bcrypt password)
- **GoogleProvider** (OAuth, enabled if `GOOGLE_CLIENT_ID` is set)

The `auth.methods` array in config controls which login buttons appear. Adding `"github"` to the array and setting up the provider enables GitHub login with no other changes.

---

## The 3 Features

### Feature A: CSV Import (`app/_components/CSVImport.tsx`)

4-step flow:
1. **Upload** — drag & drop or click to upload any CSV
2. **Map** — map CSV columns to entity fields; auto-maps matching names
3. **Preview** — shows first 3 rows of mapped data
4. **Import** — bulk POST to `/api/bulk-create/:entity`; reports created/skipped/errors

Handles: missing required fields, type coercion, partial rows, invalid data.

### Feature B: Multi-language (`app/_components/Providers.tsx`)

Simple context-based i18n:
- Translation keys in `Providers.tsx` (English + Spanish)
- `useLocale()` hook provides `t(key)`, `locale`, `setLocale`
- Language switcher in sidebar persists via React state
- Default locale from `app.locale` in config

**Adding a new language:**
```typescript
const translations = {
  fr: { 'nav.dashboard': 'Tableau de bord', ... }
}
// Then add <option value="fr">🇫🇷 FR</option> to the switcher
```

### Feature C: GitHub Export (`app/api/export/route.ts`)

Generates a ZIP containing:
- `config/app.config.json` (current config)
- `prisma/schema.prisma` (generated schema)
- `package.json` (with correct app name)
- `README.md` (generated from config — lists entities, pages, setup steps)
- `.env.example`

Download triggered by "Export ZIP" button in sidebar.

---

## Graceful Degradation Behaviors

| Scenario | Behavior |
|---|---|
| Missing config key | Zod default applied, warning logged |
| Unknown page type | FallbackRenderer with helpful message |
| Unknown field type | Rendered as text input |
| Entity not in config | 404 with clear error message |
| API error | Toast notification, UI stays intact |
| Empty data | Illustrated empty state with add button |
| Loading | Skeleton loaders (not spinners) |
| Schema mismatch | `--accept-data-loss` flag on db push |

---

## Adding New Features — Checklist

**New entity field type:**
1. Add to `FieldSchema` type union in `lib/config.ts`
2. Add Prisma mapping in `scripts/generate-schema.ts` `mapType()`
3. Handle in `FieldInput` component in `TableRenderer.tsx`

**New page type:**
1. Create renderer in `components/renderers/`
2. Register in `components/registry.tsx`

**New API endpoint:**
1. Create `app/api/your-endpoint/route.ts`
2. Use `getServerSession` for auth
3. Use `getEntity()` from `lib/config.ts` for validation

**New language:**
1. Add translations object to `Providers.tsx`
2. Add option to language selector

---

## Tech Decisions

| Decision | Why |
|---|---|
| Next.js App Router | Server components for auth checks; catch-all routes for dynamic pages |
| Prisma | Type-safe DB access; easy schema generation from code |
| Zod | Runtime validation with TypeScript inference; graceful defaults |
| NextAuth | Handles sessions, OAuth, DB adapter — saves 2-3 days of auth work |
| Recharts | Works well with React; no D3 complexity |
| JSZip | Browser + Node compatible; simple API for ZIP generation |
| papaparse | Most reliable CSV parser for browser; handles edge cases well |

## Known Limitations

1. Schema changes requiring column deletion need manual DB intervention (Prisma safety)
2. Google OAuth requires valid credentials — falls back to email-only if not set
3. Language strings are in-memory — adding a new language requires a code deploy
4. The export ZIP is a scaffold, not a complete runnable copy (no node_modules)
