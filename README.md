# Arcblog

High-performance blogging platform. It's not the best, but it's mine.

## Quick Start

```bash
bun install
bun run dev
```

Visit http://localhost:8787 to see your new app!

## Project Structure

```
├── src/main.ts       # Hono app with API routes
├── public/           # Static files (HTML, JS, CSS)
├── wrangler.toml     # CF Workers config (KV, assets)
└── tailwind.config.js
```

## Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `bun run dev`       | Start local dev server         |
| `bun run build`     | Build Tailwind CSS             |
| `bun run deploy`    | Build and deploy to Cloudflare |
| `bun run typecheck` | Type check                     |
| `bun run build:css` | Build Tailwind CSS             |

## Features

- **HTMX** for partial page updates
- **Hono** framework
- **Tailwind CSS** built locally
- **KV** binding configured for local dev
- **Static files** served from `public/`

## Deployment

```bash
bun run deploy
```

Or connect your repo in the Cloudflare dashboard - add a Build setting with command `bun run build`.

## Copyright

Licensed under MIT License by `arcmaximizer`. An AI assisted template.

## AI usage

- Refactoring to turn is_draft -> is_published
