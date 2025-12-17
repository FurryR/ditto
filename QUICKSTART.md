# Ditto - Quick Start Guide

Get Ditto up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- A GitHub account
- A Supabase account (free tier works fine)

## Quick Setup

### 1. Clone and Install (2 minutes)

```bash
git clone <your-repo-url> ditto
cd ditto
npm install
```

### 2. Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for initialization
3. Go to SQL Editor and run the contents of `supabase/schema.sql`
4. Go to Settings > API and copy:
   - Project URL
   - anon/public key

### 3. Configure GitHub OAuth (1 minute)

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - Name: Ditto Local Dev
   - Homepage: `http://localhost:3000`
   - Callback: Get from Supabase (Authentication > Providers > GitHub)
3. Copy Client ID and Secret to Supabase GitHub provider settings

### 4. Environment Variables (30 seconds)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<from-supabase-api-settings>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-api-settings>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run! (30 seconds)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## What Works Out of the Box

✅ Browse gallery (with mock data)
✅ Sign in with GitHub
✅ Upload templates (UI ready, backend TODO)
✅ View image details
✅ Multi-language support (EN, ZH, JA)
✅ Responsive design
✅ User profile

## What Needs Implementation

❌ Actual AI image generation (OpenRouter integration)
❌ Image storage (Supabase Storage)
❌ Real data fetching from database
❌ Image upscaling (Real-ESRGAN)

## Next Steps

1. **Test Authentication**: Click "Sign In" and authorize with GitHub
2. **Explore UI**: Browse all pages to see the interface
3. **Read README.md**: For detailed documentation
4. **Check DEPLOYMENT.md**: When ready to deploy

## Common Issues

**Build fails**: Run `npm run build` to see specific errors

**Can't sign in**:

- Check GitHub OAuth callback URL matches Supabase
- Verify environment variables are correct

**CSS not loading**: Clear `.next` folder and restart dev server

## Development Commands

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run lint        # Check code quality
npm run format      # Format code
npm run type-check  # Check TypeScript
```

## Getting Help

- Check the full README.md for detailed docs
- Open an issue on GitHub
- Review DEPLOYMENT.md for production setup

Happy coding! 🎭
