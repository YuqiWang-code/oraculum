# AI Removal Audit

> Date: 2026-09-18
> Baseline commit: df0e9368dbce6c627383c8836230375007fc1e76
> Target: Complete removal of all AI/LLM/cloud model code from Oraculum

## Deleted directories

| Path | Reason |
|---|---|
| `server/` | Entire Express backend (OpenAI client, AI interpret, moderation, auth, rate limit) |
| `src/components/ai/` | `AiInterpretationCard.vue` — AI interpretation UI component |
| `src/services/ai.ts` | Frontend AI API client (fetch /api/ai/*) |
| `src/types/ai.ts` | All AI-related TypeScript types |
| `tests/server/` | Server AI tests |
| `dist-server/` | Compiled server output |
| `.env.example` | AI API key configuration template |
| `docs/AI_INTEGRATION.md` | AI integration documentation |
| `docs/AI_SECURITY.md` | AI security documentation |

## Removed dependencies (package.json)

| Package | Used for |
|---|---|
| `openai` | OpenAI SDK |
| `express` | HTTP server |
| `express-rate-limit` | API rate limiting |
| `dotenv` | Environment variable loading |
| `concurrently` | Running frontend + backend together |
| `zod` | Server-side request validation (confirmed unused in src/) |
| `@types/express` | Express type definitions |
| `@types/express-rate-limit` | Rate limiter type definitions |

## Removed npm scripts

| Script | Reason |
|---|---|
| `dev:web` | Duplicate of `dev` |
| `dev:server` | No server anymore |
| `dev:full` | No server anymore |
| `build:server` | No server anymore |
| `start` | No server anymore |

## Files edited

| File | Changes |
|---|---|
| `package.json` | Removed deps/scripts, version → 4.0.0, build → pure frontend |
| `src/types/index.ts` | APP_VERSION=4.0.0, DATASET_VERSION=3.0.0, added LOCAL_KNOWLEDGE_VERSION=1.0.0 |
| `src/db/schema.ts` | Removed `AiSession` interface, removed `aiEnabled` from Settings |
| `src/db/index.ts` | Added Dexie version(3) migration (`aiSessions: null`), removed all AI session functions, cleaned exportAll/importAll |
| `src/views/ResultView.vue` | Removed `<AiInterpretationCard>` import and usage |
| `src/views/SettingsView.vue` | Removed AI configuration card, token, health check |
| `vite.config.ts` | Removed `/api` proxy to backend |

## IndexedDB migration notes

- DB version 1: history + settings (original)
- DB version 2: added aiSessions store (v2)
- DB version 3: `aiSessions: null` — store deleted
- **history and settings are fully preserved**
- Export format updated: `exportSchemaVersion: 3`, no `aiSessions` field

## Verification

- No `openai` import in source code
- No `/api/ai` references
- No `AiInterpretation` or `AiSession` types
- No AI button or AI settings in UI
- `package.json` has no openai/express/dotenv dependencies
- `server/` directory does not exist
- `.env.example` does not exist

## Note on local .env

The local `.env` file (if present) contains AI API keys and should be deleted by the user manually.
