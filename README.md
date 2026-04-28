# AppForge — Config-Driven Application Platform

A mini [base44.com](https://base44.com) — converts JSON configuration into a fully working web application with dynamic UI, APIs, and database.

## Live Demo

> Deploy to Render and add URL here

## Features

- **Config-driven** — modify `app.config.json` to change entities, pages, and settings
- **Dynamic DB schema** — auto-generated Prisma schema from config
- **Dynamic APIs** — CRUD endpoints generated for every entity
- **Dynamic UI** — table, dashboard, form renderers driven by config
- **CSV Import** — upload, map columns, bulk import data
- **Multi-language** — English and Spanish, switchable in UI
- **GitHub Export** — download your app as a ZIP
- **Auth** — email/password + Google OAuth
- **User-scoped data** — each user sees only their own records

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yourusername/config-driven-app
cd config-driven-app

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# 4. Start (auto-generates schema and runs migrations)
npm run dev
```

## Configuration

Edit `config/app.config.json`:

```json
{
  "app": { "name": "My App", "theme": "dark", "locale": "en" },
  "auth": { "methods": ["email", "google"] },
  "entities": [
    {
      "name": "Product",
      "fields": [
        { "name": "title", "type": "string", "required": true },
        { "name": "price", "type": "number" },
        { "name": "category", "type": "enum", "options": ["A", "B"] }
      ]
    }
  ],
  "pages": [
    { "route": "/products", "type": "table", "entity": "Product", "title": "Products", "actions": ["create", "edit", "delete"] },
    { "route": "/dashboard", "type": "dashboard", "title": "Dashboard", "widgets": [
      { "type": "stat", "label": "Total Products", "entity": "Product" }
    ]}
  ]
}
```

Restart dev server → schema regenerates, UI updates automatically.

## Extending

**Add a new page type:**
1. Create `components/renderers/MyRenderer.tsx`
2. Add to `components/registry.tsx`

**Add a new field type:**
1. Add to `FieldSchema` in `lib/config.ts`
2. Map in `scripts/generate-schema.ts`
3. Handle in `FieldInput` in `TableRenderer.tsx`

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full documentation.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js
- **i18n**: Custom context (English + Spanish)
- **CSV**: papaparse
- **Export**: jszip

## Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Create a PostgreSQL instance on Render
5. Deploy

## License

MIT
