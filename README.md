# DocHub DMS

A production-ready Document Management System built with Nuxt 3, Pinia, TailwindCSS, and a SQLite backend using Nitro server routes.

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and set secrets.

3. Run the development server:

```bash
pnpm dev
```

The SQLite database schema is applied automatically on server start from the scripts in `app/db/migrations`.

## Scripts

- `pnpm dev` – start Nuxt dev server
- `pnpm build` – production build
- `pnpm start` – start production server
- `pnpm lint` – run ESLint

## Storage

Document binaries are stored on the local filesystem at `STORAGE_PATH` (default `./storage/documents`). Replace the storage driver by updating the helpers in `app/server/utils/storage.ts`.
