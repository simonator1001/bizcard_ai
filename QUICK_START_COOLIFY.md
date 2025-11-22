# Quick Start: Connect to Coolify Supabase (Open-Source)

## 🚀 Fastest Method (Recommended)

Run this single command to extract and configure everything:

```bash
./scripts/extract-keys-from-coolify.sh
```

This will:
1. ✅ Automatically find your Supabase keys
2. ✅ Extract them from Docker containers or environment files
3. ✅ Configure your `.env.local` file
4. ✅ Test the connection

## 📋 Manual Method (If Auto-Extraction Fails)

### Step 1: Get Your Keys

**From Coolify Dashboard:**
1. Open Coolify → Your Supabase Service
2. Go to **Environment Variables**
3. Copy these values:
   - `SERVICE_SUPABASEANON_KEY` → This is your Anon Key
   - `SERVICE_SUPABASESERVICE_KEY` → This is your Service Role Key

**Or from VPS (SSH):**
```bash
docker exec <supabase-container> env | grep SERVICE_SUPABASEANON_KEY
docker exec <supabase-container> env | grep SERVICE_SUPABASESERVICE_KEY
```

### Step 2: Configure Your App

```bash
export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'
export SUPABASE_ANON_KEY='<paste-SERVICE_SUPABASEANON_KEY-here>'
export SUPABASE_SERVICE_ROLE_KEY='<paste-SERVICE_SUPABASESERVICE_KEY-here>'

./scripts/configure-coolify-supabase.sh
```

### Step 3: Restart Your App

```bash
pkill -f "next dev" || true
npm i && npm run dev
```

## 🔍 Need Help Finding Keys?

Run the helper script for detailed instructions:

```bash
./scripts/get-supabase-keys.sh
```

## 📚 More Information

- **Open-Source Setup Guide**: See `OPEN_SOURCE_SUPABASE.md`
- **Full Setup Guide**: See `COOLIFY_SUPABASE_SETUP.md`
- **Quick Reference**: See `COOLIFY_SETUP_SUMMARY.md`

## ✅ Verification

After setup, test your connection:
1. Open your app in the browser
2. Try logging in
3. Check browser console for Supabase connection logs

## 🆘 Troubleshooting

**Keys not found?**
- Make sure Supabase is running in Coolify
- Check Coolify dashboard for environment variables
- Try the helper script: `./scripts/get-supabase-keys.sh`

**Connection failed?**
- Verify URL is accessible: `curl https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com/rest/v1/`
- Check that keys are correct (no extra spaces)
- Ensure Supabase service is healthy in Coolify

