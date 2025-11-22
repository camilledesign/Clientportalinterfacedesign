# 🚀 Quick Start - Supabase Migration

## ⚡ TL;DR

The app has been completely migrated from the legacy API to pure Supabase. All you need to do is run the SQL setup and start using the app!

---

## 📋 Setup Steps (5 minutes)

### Step 1: Run SQL Setup

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/xnemdsxpxewvgluhczoh
2. Go to **SQL Editor**
3. Open the file `/SUPABASE_REQUESTS_ASSETS_SETUP.md` in this repo
4. Copy the SQL statements from these sections:
   - **Step 1: Create Tables** (requests + assets)
   - **Step 2: Enable RLS**
   - **Step 3: Create RLS Policies**
5. Paste and run in SQL Editor
6. Go to **Storage** → Create bucket named `assets` (Private)
7. Run the Storage policies from **Step 4**

### Step 2: Test the App

1. **Log in** as a regular user
2. **Submit a brief** (Brand, Website, or Product)
3. **Check Request History** - Your brief should appear
4. **Check Assets Library** - Should show empty state (not an error)

5. **Log in as admin** (set `is_admin = true` in profiles table)
6. **View Clients** - Should see all profiles
7. **Click on a client** - Should see their requests and assets

---

## ✅ What Was Migrated

### From Legacy API → Supabase:

| Feature | Before | After |
|---------|--------|-------|
| **Brief Submission** | POST to old Edge Function | INSERT into `public.requests` |
| **Request History** | Fetch from old API | SELECT from `public.requests` |
| **Assets Library** | Fetch from old API | SELECT from `public.assets` |
| **Admin Client List** | Fetch from old API | SELECT from `public.profiles` |
| **Asset Upload** | Upload to old system | Upload to Storage + INSERT into `public.assets` |
| **Authentication** | localStorage.user_email | Supabase Auth + RLS |
| **Authorization** | admin_session_token | `profiles.is_admin` flag |

### Removed:

- ❌ All fetch calls to `https://jqdmpwuzthojykzyhevh.supabase.co/functions/v1/make-server-a93d7fb4/*`
- ❌ localStorage.user_email checks
- ❌ admin_session_token
- ❌ X-User-Session headers
- ❌ Debug/health endpoints
- ❌ Database viewer buttons
- ❌ Seed database functions

---

## 📁 Key Files Changed

### Core Infrastructure:
- `/utils/supabase/db.ts` - **EXTENDED** with request & asset helpers
- `/utils/api.ts` - **REFACTORED** to re-export Supabase helpers
- `/SUPABASE_REQUESTS_ASSETS_SETUP.md` - **NEW** SQL setup guide

### Components Fixed:
- `/components/forms/BrandRequestForm.tsx` - Uses new API
- `/components/RequestHistory.tsx` - Uses Supabase directly
- `/components/AssetsLibrary.tsx` - Uses Supabase directly
- `/components/admin/AdminDashboard.tsx` - Cleaned up, removed debug buttons

### Documentation:
- `/MIGRATION_COMPLETE.md` - Detailed migration guide
- `/QUICK_START.md` - **THIS FILE** - Quick setup guide

---

## 🧪 Testing Checklist

### User Flow:
- [ ] Can log in with email + password
- [ ] Can submit a Brand brief
- [ ] Can submit a Website brief
- [ ] Can submit a Product brief
- [ ] Brief appears in Request History
- [ ] Assets Library shows empty state (no errors)
- [ ] Can log out

### Admin Flow:
- [ ] Can log in as admin
- [ ] Can see all clients in dashboard
- [ ] Stats cards show correct counts
- [ ] Can click "View" on a client
- [ ] Can see client's requests (if any)
- [ ] Can see client's assets (if any)
- [ ] Can log out

---

## 🐛 Troubleshooting

### Error: "relation 'requests' does not exist"
→ Run the SQL from `SUPABASE_REQUESTS_ASSETS_SETUP.md` Step 1

### Error: "new row violates row-level security policy"
→ Run the RLS policies from `SUPABASE_REQUESTS_ASSETS_SETUP.md` Step 3

### Error: "bucket does not exist"
→ Create the `assets` bucket in Storage (Private)

### Admin can't see all clients
→ Make sure you set `is_admin = true` in the profiles table:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'your-admin@email.com';
```

### "Not authenticated" errors
→ Log out and log back in. The session should be fresh.

---

## 🎯 Next Steps (Optional)

### Add More Features:

1. **Request Status Updates**
   - Add UI for admins to mark requests as "in_progress", "completed", "delivered"
   - Use `updateRequestStatus()` from `/utils/supabase/db.ts`

2. **Notes System**
   - Create a `notes` table for client notes
   - Add CRUD operations in `/utils/supabase/db.ts`
   - Add UI in AdminClientDetail

3. **Asset Categories**
   - Add `category` column to assets table
   - Add filter UI in AssetsLibrary

4. **Realtime Updates**
   - Use `subscribeToTable()` from `/utils/supabase/db.ts`
   - Show live updates when new requests/assets are added

---

## 📚 Documentation

- **Complete migration details:** `/MIGRATION_COMPLETE.md`
- **SQL setup instructions:** `/SUPABASE_REQUESTS_ASSETS_SETUP.md`
- **Auth migration (previous):** `/AUTH_MIGRATION_SUMMARY.md`

---

## ✨ Summary

You now have a **clean, modern Supabase architecture** with:

- ✅ Proper database tables with RLS
- ✅ Storage for file uploads
- ✅ Type-safe helper functions
- ✅ No legacy API dependencies
- ✅ Clean separation of concerns
- ✅ Admin/client authorization via RLS

**Just run the SQL setup and you're ready to go!** 🎉
