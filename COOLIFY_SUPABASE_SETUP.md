# Coolify Supabase Setup Guide

This guide will help you connect your Next.js app to your Supabase instance hosted on Coolify.

## Prerequisites

You need the following information from your Coolify Supabase dashboard:

1. **Supabase URL**: `https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com`
2. **Anon Key** (Public Key): Found in Supabase Dashboard → Settings → API → Project API keys → `anon` / `public`
3. **Service Role Key** (Secret Key): Found in Supabase Dashboard → Settings → API → Project API keys → `service_role`

## How to Get Your Keys (Open-Source Supabase)

**Important**: The open-source version of Supabase stores keys differently than the managed service. Keys are in environment variables, not in a dashboard.

### Option 1: Automated Extraction (Recommended)

Run the automated extraction script:

```bash
./scripts/extract-keys-from-coolify.sh
```

This script will:
- Check Docker containers for environment variables
- Check common environment file locations
- Extract keys automatically if possible

### Option 2: From Coolify Dashboard

1. Open your Coolify dashboard
2. Navigate to your Supabase service/resource
3. Go to **Environment Variables** or **Settings**
4. Look for these variables:
   - `SERVICE_FQDN_SUPABASEKONG` → This is your `SUPABASE_URL`
   - `SERVICE_SUPABASEANON_KEY` → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SERVICE_SUPABASESERVICE_KEY` → This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Option 3: From Docker Containers (If you have SSH access)

1. SSH into your VPS where Coolify is running
2. Find Supabase containers:
   ```bash
   docker ps | grep supabase
   ```
3. Extract environment variables:
   ```bash
   # From supabase-studio container
   docker exec <container-name> env | grep SERVICE_SUPABASEANON_KEY
   docker exec <container-name> env | grep SERVICE_SUPABASESERVICE_KEY
   
   # Or get all Supabase-related env vars
   docker exec <container-name> env | grep SUPABASE
   ```

### Option 4: Helper Script with Instructions

Run the helper script for detailed instructions:

```bash
./scripts/get-supabase-keys.sh
```

This will show you all available methods to extract keys.

## Quick Setup

### Local Development

1. **Get your keys** (see above)

2. **Run the configuration script**:
```bash
export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'
export SUPABASE_ANON_KEY='your-anon-key-here'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'

./scripts/configure-coolify-supabase.sh
```

3. **Restart your development server**:
```bash
pkill -f "next dev" || true
npm i && npm run dev
```

### VPS/Production Setup

1. **SSH into your VPS**

2. **Navigate to your project directory**

3. **Run the configuration script**:
```bash
export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'
export SUPABASE_ANON_KEY='your-anon-key-here'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'

./scripts/configure-coolify-supabase.sh
```

4. **If using Coolify for your Next.js app**:
   - Add the environment variables in Coolify dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Restart the service in Coolify

5. **If running manually on VPS**:
```bash
pkill -f "next dev" || true
npm i && npm run dev
```

## Manual Configuration

If you prefer to configure manually:

1. **Create/Update `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. **Restart your application**

## Verification

After configuration, verify the connection:

1. **Check the browser console** - Look for Supabase connection logs
2. **Try logging in** - Test authentication
3. **Check database queries** - Verify data access works

## Troubleshooting

### Connection Issues

- **Verify the URL**: Make sure it's accessible from your network
- **Check CORS settings**: Ensure your app domain is allowed in Supabase
- **Verify keys**: Double-check that keys are correct and not expired

### Authentication Issues

- **Check redirect URLs**: Ensure your app's callback URLs are configured in Supabase
- **Verify JWT settings**: Check that JWT expiration and settings match

### Environment Variables Not Loading

- **Check file location**: `.env.local` should be in the project root
- **Restart the app**: Environment variables are loaded at startup
- **Check Next.js version**: Ensure you're using a compatible version

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `.env.local`** to version control
2. **Service Role Key is secret** - Only use on server-side
3. **Anon Key is public** - Safe to use in client-side code
4. **Use environment variables** in production, not hardcoded values

## Support

If you encounter issues:

1. Check the Supabase logs in Coolify
2. Check your Next.js application logs
3. Verify all environment variables are set correctly
4. Ensure your Supabase instance is running and healthy

