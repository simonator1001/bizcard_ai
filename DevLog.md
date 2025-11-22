# Development Log

## 2025-01-XX - Coolify Supabase Integration

### Summary
Migrated the application from managed Supabase to open-source Supabase instance hosted on Coolify.

### Changes Made

#### 1. Supabase Configuration
- **Updated Supabase client** (`lib/supabase-client-new.ts`):
  - Removed hardcoded fallback URL
  - Added proper environment variable validation
  - Fixed TypeScript errors for undefined URL checks

- **Updated auth debug page** (`app/auth/debug/page.tsx`):
  - Changed to use environment variable for callback URL instead of hardcoded value

#### 2. Environment Variables
- **Configured `.env.local`** with Coolify Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`: `https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From `SERVICE_SUPABASEANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`: From `SERVICE_SUPABASESERVICE_KEY`

#### 3. Automation Scripts Created
- **`scripts/configure-coolify-supabase.sh`**: Main configuration script that:
  - Updates `.env.local` with Supabase credentials
  - Backs up existing configuration
  - Tests connection
  - Verifies code configuration

- **`scripts/extract-keys-from-coolify.sh`**: Automated key extraction script that:
  - Checks Docker containers for environment variables
  - Checks environment files
  - Extracts keys automatically
  - Offers to configure app automatically

- **`scripts/get-supabase-keys.sh`**: Helper script with detailed instructions for:
  - Manual key extraction from Coolify dashboard
  - Docker container inspection
  - Environment file locations
  - Multiple extraction methods

#### 4. Documentation Created
- **`OPEN_SOURCE_SUPABASE.md`**: Guide for open-source Supabase setup
- **`COOLIFY_SUPABASE_SETUP.md`**: Detailed setup guide
- **`COOLIFY_SETUP_SUMMARY.md`**: Quick reference guide
- **`QUICK_START_COOLIFY.md`**: Fastest setup method

#### 5. Build Fixes
- **Fixed TypeScript errors**:
  - Added proper null checks for `SUPABASE_URL` in `lib/supabase-client-new.ts`
  - Fixed Stripe API version compatibility issues (changed from `2025-05-28.basil` to `2025-04-30.basil`)

- **Updated TypeScript config** (`tsconfig.json`):
  - Excluded `mcp-modelcontextprotocol` directory from TypeScript checking

- **Updated Next.js config** (`next.config.js`):
  - Added webpack configuration to handle MCP protocol externals

### Key Differences: Open-Source vs Managed Supabase

| Aspect | Managed Supabase | Open-Source (Coolify) |
|--------|------------------|----------------------|
| Key Location | Dashboard UI | Environment Variables |
| Anon Key | `anon` key in dashboard | `SERVICE_SUPABASEANON_KEY` |
| Service Key | `service_role` in dashboard | `SERVICE_SUPABASESERVICE_KEY` |
| URL | Project URL in dashboard | `SERVICE_URL_SUPABASEKONG` |

### Environment Variable Mapping

| Coolify Variable | Next.js Variable | Purpose |
|-----------------|------------------|---------|
| `SERVICE_URL_SUPABASEKONG` | `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `SERVICE_SUPABASEANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-side) |
| `SERVICE_SUPABASESERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Secret service key (server-side) |

### Testing
- ✅ Build successful (`npm run build`)
- ✅ Environment variables configured
- ✅ Supabase connection tested (HTTP 200)
- ✅ Code configuration verified

### Next Steps
1. Test authentication flow
2. Verify database operations
3. Test all Supabase-dependent features
4. Deploy to production

### Files Modified
- `lib/supabase-client-new.ts`
- `app/auth/debug/page.tsx`
- `.env.local` (created/updated)
- `tsconfig.json`
- `next.config.js`
- `pages/api/checkout/create-session.ts`
- `pages/api/checkout/verify-session.ts`
- `pages/api/webhooks/stripe.ts`

### Files Created
- `scripts/configure-coolify-supabase.sh`
- `scripts/extract-keys-from-coolify.sh`
- `scripts/get-supabase-keys.sh`
- `OPEN_SOURCE_SUPABASE.md`
- `COOLIFY_SUPABASE_SETUP.md`
- `COOLIFY_SETUP_SUMMARY.md`
- `QUICK_START_COOLIFY.md`
- `DevLog.md`

### Notes
- All Supabase keys are now stored in `.env.local` (not committed to git)
- Configuration script creates backups before modifying `.env.local`
- Helper scripts support both automated and manual key extraction
- Documentation covers open-source Supabase specific differences

