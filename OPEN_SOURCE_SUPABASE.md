# Open-Source Supabase Setup (Coolify)

## Key Differences from Managed Supabase

The **open-source version** of Supabase (self-hosted on Coolify) stores keys differently:

| Managed Supabase | Open-Source Supabase (Coolify) |
|-----------------|-------------------------------|
| Keys in Dashboard UI | Keys in Environment Variables |
| `anon` and `service_role` keys | `SERVICE_SUPABASEANON_KEY` and `SERVICE_SUPABASESERVICE_KEY` |
| Access via Settings → API | Access via Coolify Dashboard or Docker |

## Quick Start

### 1. Extract Keys Automatically

```bash
./scripts/extract-keys-from-coolify.sh
```

This script will:
- ✅ Check Docker containers
- ✅ Check environment files
- ✅ Extract keys automatically
- ✅ Offer to configure your app

### 2. If Automatic Extraction Fails

**Option A: From Coolify Dashboard**
1. Open Coolify → Your Supabase Service
2. Go to **Environment Variables**
3. Copy:
   - `SERVICE_SUPABASEANON_KEY` → Your Anon Key
   - `SERVICE_SUPABASESERVICE_KEY` → Your Service Role Key
   - `SERVICE_FQDN_SUPABASEKONG` → Your Supabase URL

**Option B: From Docker (SSH Access)**
```bash
# Find containers
docker ps | grep supabase

# Extract keys
docker exec <container-name> env | grep SERVICE_SUPABASEANON_KEY
docker exec <container-name> env | grep SERVICE_SUPABASESERVICE_KEY
```

**Option C: Helper Script**
```bash
./scripts/get-supabase-keys.sh
```
This shows detailed instructions for all methods.

### 3. Configure Your App

Once you have the keys:

```bash
export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'
export SUPABASE_ANON_KEY='<value-from-SERVICE_SUPABASEANON_KEY>'
export SUPABASE_SERVICE_ROLE_KEY='<value-from-SERVICE_SUPABASESERVICE_KEY>'

./scripts/configure-coolify-supabase.sh
```

## Environment Variable Mapping

| Coolify Variable | Next.js Variable | Description |
|-----------------|------------------|-------------|
| `SERVICE_FQDN_SUPABASEKONG` | `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `SERVICE_SUPABASEANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-side) |
| `SERVICE_SUPABASESERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Secret service key (server-side) |

## Troubleshooting

### "Keys not found" Error

1. **Check if Supabase is running:**
   ```bash
   docker ps | grep supabase
   ```

2. **Check Coolify dashboard** for environment variables

3. **Try manual extraction** using the helper script

### "Connection failed" Error

1. **Verify URL is accessible:**
   ```bash
   curl https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com/rest/v1/
   ```

2. **Check CORS settings** in Supabase configuration

3. **Verify keys are correct** (no extra spaces or quotes)

## Scripts Available

- **`extract-keys-from-coolify.sh`** - Automated key extraction (try this first!)
- **`get-supabase-keys.sh`** - Detailed instructions for manual extraction
- **`configure-coolify-supabase.sh`** - Configure your app with extracted keys

## Security Notes

⚠️ **Important**:
- `SERVICE_SUPABASESERVICE_KEY` is **SECRET** - never expose it
- `SERVICE_SUPABASEANON_KEY` is **PUBLIC** - safe for client-side
- Never commit keys to version control
- Use environment variables, not hardcoded values

