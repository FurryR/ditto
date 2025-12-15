# Deployment Checklist

Use this checklist to ensure your Ditto application is properly configured before deploying to production.

## ☑️ Pre-Deployment Checklist

### 1. Supabase Configuration

- [ ] Created Supabase project
- [ ] Executed `supabase/schema.sql` in SQL Editor
- [ ] Verified all tables are created
- [ ] Verified Row Level Security (RLS) policies are active
- [ ] Configured GitHub OAuth provider
- [ ] Tested authentication flow locally

### 2. GitHub OAuth App

- [ ] Created GitHub OAuth App
- [ ] Set correct Homepage URL (production URL)
- [ ] Set correct Authorization callback URL
  - Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- [ ] Added Client ID and Secret to Supabase
- [ ] Tested login flow

### 3. Environment Variables

Local (.env.local):

- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_SITE_URL=http://localhost:3000

Production (Vercel/Platform):

- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_SITE_URL=https://your-domain.com

### 4. Code Quality

- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run format:check` - All files formatted
- [ ] Run `npm run type-check` - No type errors
- [ ] Run `npm run build` - Build succeeds
- [ ] Test all pages locally
- [ ] Test authentication flow
- [ ] Test responsive design on mobile

### 5. Security

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys committed to repository
- [ ] Supabase RLS policies tested
- [ ] CORS configured properly
- [ ] Rate limiting considered for API routes

### 6. Performance

- [ ] Images optimized (Next.js Image component used)
- [ ] Lazy loading implemented where needed
- [ ] Bundle size checked
- [ ] Lighthouse score reviewed

### 7. Content

- [ ] Updated README with correct information
- [ ] Removed placeholder content
- [ ] Added sample data (optional)
- [ ] Verified all translations

## 🚀 Deployment Steps

### Vercel Deployment

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all production environment variables
   - Apply to Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Visit your site

5. **Update GitHub OAuth**
   - Add production URL to GitHub OAuth app:
     - Homepage URL: `https://your-app.vercel.app`
     - Keep Supabase callback URL as is
   - Update Supabase Site URL if needed

## ✅ Post-Deployment Verification

- [ ] Visit production site
- [ ] Test GitHub authentication
- [ ] Upload a template
- [ ] Browse gallery
- [ ] Test language switching
- [ ] Check mobile responsiveness
- [ ] Verify all links work
- [ ] Test API endpoints
- [ ] Check browser console for errors
- [ ] Verify analytics (if configured)

## 🔧 Troubleshooting

### Authentication Issues

**Problem**: "Authentication error" or redirect fails

**Solutions**:

1. Verify GitHub OAuth callback URL matches Supabase
2. Check environment variables are set correctly
3. Ensure NEXT_PUBLIC_SITE_URL is correct
4. Clear browser cookies and try again

### Build Errors

**Problem**: Build fails on Vercel

**Solutions**:

1. Check build logs for specific errors
2. Ensure all dependencies are in package.json
3. Verify TypeScript types are correct
4. Test build locally: `npm run build`

### Database Connection Issues

**Problem**: Cannot connect to Supabase

**Solutions**:

1. Verify Supabase URL and anon key
2. Check if Supabase project is active
3. Verify RLS policies allow read access
4. Check network/firewall settings

### Image Loading Issues

**Problem**: Images not loading

**Solutions**:

1. Check Next.js image domains configuration
2. Verify image URLs are accessible
3. Check CORS settings
4. Use placeholder images for testing

## 📊 Monitoring

After deployment, monitor:

- Error rates (Vercel Analytics)
- Performance metrics (Lighthouse)
- User authentication success rate
- API response times
- Database query performance
- User feedback

## 🔄 Continuous Deployment

Set up automatic deployments:

1. **GitHub Integration**
   - Vercel automatically deploys on push to main
   - Preview deployments for pull requests

2. **Branch Protection**
   - Require pull request reviews
   - Require status checks to pass
   - Set up CI/CD if needed

3. **Rollback Plan**
   - Vercel allows instant rollback to previous deployment
   - Keep database migration scripts versioned

## 📝 Notes

- Always test in preview deployment before merging to main
- Keep environment variables synced between local and production
- Document any custom configuration
- Update this checklist as needed

---

Last updated: 2025-12-09
