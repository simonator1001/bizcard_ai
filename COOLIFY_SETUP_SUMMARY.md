# Coolify Supabase Setup - Quick Reference

## What You Need to Provide

To connect your app to your Coolify-hosted Supabase, I need **3 pieces of information**:

### 1. Supabase URL ✅ (You already provided this)
```
https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com
```

### 2. Anon Key (Public Key)
- **Where to find**: 
  - **Open-Source**: Coolify Dashboard → Environment Variables → `SERVICE_SUPABASEANON_KEY`
  - **Or**: Run `./scripts/extract-keys-from-coolify.sh` to auto-extract
- **What it's used for**: Client-side operations (safe to expose)
- **Environment variable**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Coolify variable name**: `SERVICE_SUPABASEANON_KEY`

### 3. Service Role Key (Secret Key) ⚠️
- **Where to find**:
  - **Open-Source**: Coolify Dashboard → Environment Variables → `SERVICE_SUPABASESERVICE_KEY`
  - **Or**: Run `./scripts/extract-keys-from-coolify.sh` to auto-extract
- **What it's used for**: Server-side admin operations (KEEP SECRET!)
- **Environment variable**: `SUPABASE_SERVICE_ROLE_KEY`
- **Coolify variable name**: `SERVICE_SUPABASESERVICE_KEY`

## Quick Setup Commands

### Step 1: Extract Keys (Open-Source Version)

**Try automated extraction first:**
```bash
./scripts/extract-keys-from-coolify.sh
```

If that works, it will automatically configure everything!

**Or manually set your credentials:**
```bash
# Set your credentials (from Coolify environment variables)
export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'
export SUPABASE_ANON_KEY='your-SERVICE_SUPABASEANON_KEY-value'
export SUPABASE_SERVICE_ROLE_KEY='your-SERVICE_SUPABASESERVICE_KEY-value'

# Run the automated configuration
./scripts/configure-coolify-supabase.sh

# Restart your app
pkill -f "next dev" || true
npm i && npm run dev
```

## What the Script Does

The automation script will:

1. ✅ **Update `.env.local`** with your Supabase credentials
2. ✅ **Backup existing configuration** (creates `.env.local.backup.*`)
3. ✅ **Test the connection** to verify it works
4. ✅ **Verify code configuration** uses environment variables correctly
5. ✅ **Provide next steps** for deployment

## Files Modified

The following files have been updated to work with environment variables:

- ✅ `lib/supabase-client-new.ts` - Now requires `NEXT_PUBLIC_SUPABASE_URL` (no hardcoded fallback)
- ✅ `app/auth/debug/page.tsx` - Uses environment variable for callback URL
- ✅ `.env.local` - Will be created/updated with your credentials

## For VPS Deployment

If deploying to VPS via Coolify:

1. **Add environment variables in Coolify dashboard**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Or use the script on VPS**:
   ```bash
   # SSH into VPS
   cd /path/to/your/app
   export SUPABASE_URL='...'
   export SUPABASE_ANON_KEY='...'
   export SUPABASE_SERVICE_ROLE_KEY='...'
   ./scripts/configure-coolify-supabase.sh
   ```

3. **Restart your service** in Coolify

## Helper Scripts

- **`scripts/configure-coolify-supabase.sh`** - Main configuration script
- **`scripts/get-supabase-keys.sh`** - Guide to finding your keys
- **`COOLIFY_SUPABASE_SETUP.md`** - Detailed setup guide

## Next Steps After Configuration

1. ✅ Get your keys from Supabase Studio
2. ✅ Run the configuration script
3. ✅ Test the connection (try logging in)
4. ✅ Verify database operations work
5. ✅ Deploy to production

## Troubleshooting

**Can't find the keys?**
- Run: `./scripts/get-supabase-keys.sh` for detailed instructions

**Connection not working?**
- Check that your Supabase instance is running in Coolify
- Verify the URL is accessible: `curl https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com/rest/v1/`
- Check CORS settings in Supabase

**Need more help?**
- See `COOLIFY_SUPABASE_SETUP.md` for detailed troubleshooting

