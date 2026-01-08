# FieldMCP

MCP infrastructure platform for agricultural APIs. Developers integrate once, access John Deere (and later Climate FieldView, CNHi) through unified MCP servers.

## EXTREMELY IMPORTANT!!!!
YOU ARE DEVELOPING ON A WINDOWS 11 MACHINE.
MOST LINUX COMMANDS WILL NOT WORK!!! ADJUST ACCORDINGLY!!!

## Quick Commands

```bash
pnpm build            # Build all packages (turbo)
pnpm dev              # Start dashboard + workers in dev mode (hot reload)
pnpm start:local      # Build and run all services locally (production-like)
pnpm lint             # Run Biome linter (check)
pnpm lint:fix         # Run Biome linter with auto-fix
pnpm check            # TypeScript type check (turbo)
pnpm clean            # Clean build artifacts (turbo)
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:reset   # Reset Supabase database
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Developer App  │────▶│   MCP Gateway    │────▶│ John Deere MCP  │
│  (Claude, etc)  │     │ (Cloudflare)     │     │ (Cloudflare)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │    Supabase      │     │  John Deere API │
                        │ (Auth, DB, Vault)│     │                 │
                        └──────────────────┘     └─────────────────┘
```

- **Cloudflare Workers**: MCP servers (mcp-gateway, mcp-john-deere)
- **Supabase**: Auth, PostgreSQL, encrypted token storage
- **Vercel**: Next.js 16 dashboard (apps/dashboard)
- **Turborepo**: Monorepo orchestration

## Key Directories

```
fieldmcp/
├── apps/
│   └── dashboard/          # Next.js developer dashboard
├── packages/
│   ├── types/              # Shared TypeScript types (@fieldmcp/types)
│   ├── mcp-gateway/        # API gateway worker - auth, rate limits, routing
│   ├── mcp-john-deere/     # John Deere MCP server - tools for JD API
│   └── supabase/           # Migrations and edge functions
└── docs/
    └── plans/              # Execution plans for Claude Code
```

## Standards

- TypeScript everywhere, strict mode
- Biome for linting/formatting (NOT ESLint/Prettier)
- pnpm workspaces
- Commit after each completed task

## Code Patterns

### API Keys
- Format: `field_live_` + 32 random chars
- Storage: SHA-256 hash in DB, never plaintext
- Validation: Check hash, cache result in KV for 5 min

### OAuth Tokens
- Encrypted at rest (base64 for MVP, Supabase Vault for prod)
- Proactive refresh when < 5 min remaining
- Cached in KV per developer+farmer+provider

### MCP Tools
```typescript
// Pattern: Zod schema → handler → normalize → return
export const toolSchema = z.object({ ... });
export async function toolHandler(input, client) {
  const response = await client.apiCall();
  const normalized = normalizeResponse(response);
  return { content: [{ type: 'text', text: JSON.stringify(normalized) }] };
}
```

### Rate Limiting
- Sliding window per minute in Cloudflare KV
- Limits by tier: Free=10/min, Developer=100/min, Startup=500/min

## Workflows

### Before modifying MCP server code:
1. Check if change affects shared types in `packages/types`
2. Update types package first if needed
3. Run `pnpm check` before committing

### Before modifying Supabase schema:
1. Create new migration: `pnpm --filter @fieldmcp/supabase db:new migration_name`
2. Test locally: `pnpm --filter @fieldmcp/supabase db:reset`
3. NEVER modify existing migrations

### Before deploying:
1. Run `pnpm build` from root
2. Run `pnpm check` from root
3. Run `pnpm lint` from root

## Environment Variables

### packages/mcp-gateway (Cloudflare secrets)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GATEWAY_SECRET` (shared secret for MCP server auth)
- `INTERNAL_SECRET` (secret for internal cache invalidation endpoint)

### packages/mcp-john-deere (Cloudflare secrets)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JOHN_DEERE_CLIENT_ID`
- `JOHN_DEERE_CLIENT_SECRET`
- `GATEWAY_SECRET` (must match gateway's secret)

### apps/dashboard (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JOHN_DEERE_CLIENT_ID`
- `JOHN_DEERE_CLIENT_SECRET`
- `JOHN_DEERE_REDIRECT_URI`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GATEWAY_URL` (gateway URL for cache invalidation)
- `GATEWAY_INTERNAL_SECRET` (must match gateway's INTERNAL_SECRET)

## API Reference

### John Deere
- Auth: `https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize`
- Token: `https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token`
- API: `https://sandboxapi.deere.com/platform` (sandbox), `https://api.deere.com/platform` (prod)
- Scopes: `ag1 ag2 ag3 offline_access`
- Header: `Accept: application/vnd.deere.axiom.v3+json`

## Next.js 16 Notes

- **Auth uses `proxy.ts`, NOT `middleware.ts`** - Next.js 16 uses proxy for auth
- Webhook routes must be excluded from auth checks in `src/proxy.ts`

## Troubleshooting

### "Module not found" errors
Run `pnpm install` from root, then `pnpm build`

### Type errors in IDE but build passes
Restart TypeScript server, or run `pnpm check` to verify

### OAuth callback fails
Check redirect URI matches exactly in John Deere dev portal and env vars

### Rate limit errors in dev
KV state persists - wait 1 minute or use different developer ID