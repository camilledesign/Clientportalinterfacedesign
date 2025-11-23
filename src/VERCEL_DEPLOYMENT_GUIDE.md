# Vercel Deployment Guide

## ✅ Supabase Dependency Fix Applied

**Issue Fixed**: Changed from incorrect JSR package to official NPM package.

### What Changed:

**Before** (incorrect):
```json
"@jsr/supabase__supabase-js": "^2.49.8"
```

**After** (correct):
```json
"@supabase/supabase-js": "^2.49.8"
```

All imports in the codebase already use `@supabase/supabase-js`, so no code changes were needed.

---

## 📦 Files Created for Vercel Deployment

The following files have been added to ensure successful Vercel deployment:

### 1. `/package.json` ✅
- **Purpose**: Defines all NPM dependencies for the project
- **Key Change**: Uses `@supabase/supabase-js` (official NPM package)
- **Includes**: React, Vite, Tailwind CSS, Radix UI, Supabase, and all other dependencies

### 2. `/vercel.json` ✅
- **Purpose**: Vercel deployment configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Includes**: SPA routing configuration

### 3. `/vite.config.ts` ✅
- **Purpose**: Vite build configuration
- **Output**: `dist` folder
- **Optimization**: Code splitting for React and UI vendors
- **Includes**: Supabase in optimizeDeps

### 4. `/tsconfig.json` ✅
- **Purpose**: TypeScript configuration
- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **Includes**: All source files except Supabase functions

### 5. `/index.html` ✅
- **Purpose**: HTML entry point for Vite
- **Loads**: `/main.tsx` as the entry script

### 6. `/main.tsx` ✅
- **Purpose**: React application entry point
- **Imports**: App component and global CSS
- **Renders**: React app with StrictMode

### 7. `/tailwind.config.js` ✅
- **Purpose**: Tailwind CSS configuration
- **Content**: Scans all TS/TSX/JS/JSX files

### 8. `/postcss.config.js` ✅
- **Purpose**: PostCSS configuration
- **Plugins**: Tailwind CSS and Autoprefixer

### 9. `/.gitignore` ✅
- **Purpose**: Excludes build artifacts and dependencies from Git
- **Excludes**: node_modules, dist, .env files, etc.

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Fix Supabase dependency for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Vite configuration
5. Add environment variables (see below)
6. Click "Deploy"

#### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

### Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

**Required for Frontend:**
- None needed - Supabase config is in code via `/utils/supabase/info.tsx`

**Required for Edge Functions (if deploying separately):**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_ANON_KEY` - Your Supabase anon key

---

## ✅ Build Verification

Vercel will run these commands:

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# This should create a dist/ folder with:
# - index.html
# - assets/index-[hash].js
# - assets/index-[hash].css
# - Other optimized chunks
```

### Expected Output:

```
✓ Built in 5.23s
✓ 127 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.30 kB
dist/assets/index-abc123.css     15.67 kB │ gzip:  4.21 kB
dist/assets/react-vendor-def456.js  143.21 kB │ gzip: 46.08 kB
dist/assets/ui-vendor-ghi789.js    89.54 kB │ gzip: 28.43 kB
dist/assets/index-jkl012.js       78.92 kB │ gzip: 25.67 kB
✓ built in 5.23s
```

---

## 🔍 Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution**: This should now be fixed with the package.json update. If you still see this:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Check that package.json has `"@supabase/supabase-js": "^2.49.8"`

### Issue: "No dist folder generated"

**Solution**: 
1. Run `npm run build` locally to test
2. Check that `vite.config.ts` exists
3. Verify `index.html` and `main.tsx` exist
4. Check Vercel build logs for errors

### Issue: "Module not found" for Radix UI components

**Solution**: All Radix UI packages are in package.json. If missing:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### Issue: "Tailwind CSS not working"

**Solution**: Ensure these files exist:
- `tailwind.config.js`
- `postcss.config.js`
- `styles/globals.css` (with Tailwind directives)

### Issue: Supabase functions not deploying

**Note**: The Supabase Edge Functions in `/supabase/functions/` are meant to be deployed to Supabase, not Vercel:

```bash
# Deploy to Supabase (not Vercel)
supabase functions deploy make-server-a93d7fb4
```

---

## 📁 Project Structure

```
/
├── package.json              ✅ NPM dependencies (Supabase fixed)
├── vercel.json              ✅ Vercel config
├── vite.config.ts           ✅ Vite config
├── tsconfig.json            ✅ TypeScript config
├── tailwind.config.js       ✅ Tailwind config
├── postcss.config.js        ✅ PostCSS config
├── index.html               ✅ HTML entry point
├── main.tsx                 ✅ React entry point
├── App.tsx                  Main app component
├── components/              React components
│   ├── admin/              Admin components
│   ├── assets/             Asset display components
│   ├── forms/              Request forms
│   ├── ui/                 Shadcn UI components
│   └── ...
├── pages/                   Page components
├── utils/                   Utility functions
│   ├── api.ts              API helpers
│   ├── auth.ts             Auth helpers
│   └── supabase/           Supabase config
├── styles/                  CSS files
│   └── globals.css         Global styles
└── supabase/               Supabase Edge Functions (deploy separately)
    └── functions/
        └── server/
```

---

## 🎯 Success Checklist

After deployment, verify:

- ✅ Vercel build succeeds without errors
- ✅ `dist/` folder is created with all assets
- ✅ Deployed site loads at your Vercel URL
- ✅ Login page appears (Apple-inspired design)
- ✅ Can log in with test credentials
- ✅ Dashboard loads correctly
- ✅ Request forms work
- ✅ Assets library displays
- ✅ Admin panel accessible (for admin users)
- ✅ No console errors about Supabase
- ✅ All API calls to Supabase work

---

## 🔗 Supabase Edge Functions

**Important**: The Edge Functions in `/supabase/functions/server/` should be deployed to **Supabase**, not Vercel:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref xnemdsxpxewvgluhczoh

# Deploy the Edge Function
supabase functions deploy make-server-a93d7fb4
```

The frontend (deployed to Vercel) will make API calls to:
```
https://xnemdsxpxewvgluhczoh.supabase.co/functions/v1/make-server-a93d7fb4/*
```

---

## 📝 Commit Message Template

```
Fix Supabase dependency so Vercel can build properly

- Changed from @jsr/supabase__supabase-js to @supabase/supabase-js
- Added all necessary build configuration files
- Created Vite config, TypeScript config, and Vercel config
- Added entry points (index.html, main.tsx)
- Ready for npm install && npm run build on Vercel
```

---

## 🎉 Ready to Deploy!

Your project is now configured for Vercel deployment with:

1. ✅ **Correct Supabase dependency** (`@supabase/supabase-js`)
2. ✅ **Complete build configuration** (Vite, TypeScript, Tailwind)
3. ✅ **Vercel-optimized settings** (SPA routing, output directory)
4. ✅ **All necessary entry points** (HTML, TSX)

Run `npm install && npm run build` locally to test, then push to GitHub and deploy to Vercel!

---

**Last Updated**: After Supabase dependency fix
**Status**: ✅ Ready for Vercel Deployment
