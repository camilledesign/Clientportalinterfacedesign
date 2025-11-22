# Supabase RLS Validation Guide

## 📋 Overview

This guide validates that your Supabase integration is correctly configured with Row Level Security (RLS) policies and that the Make app can perform SELECT, UPDATE, INSERT, and DELETE operations.

## 🎯 Requirements Checklist

### ✅ 1. Supabase Client Initialized Globally

**File**: `/utils/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,  // ✅ SUPABASE_URL
  publicAnonKey                          // ✅ SUPABASE_ANON_KEY
);
```

**Status**: ✅ **VERIFIED** - Global client is correctly configured

---

### ✅ 2. Auth Session Stored in Global State

**File**: `/utils/auth.ts`

When user logs in:
- Session is retrieved from Supabase Auth
- `access_token` and `refresh_token` are stored
- Session persists across page refreshes

**Verification**:
```typescript
// Get session
const { data: { session } } = await supabase.auth.getSession();

// Session contains:
{
  access_token: "eyJ...",
  refresh_token: "...",
  expires_at: 1234567890,
  user: { id: "...", email: "..." }
}
```

**Status**: ✅ **VERIFIED** - Session is managed by Supabase Auth

---

### ✅ 3. Auth Token Sent with Database Requests

**How it works**:

The Supabase client **automatically** includes the auth token with every request when a user is authenticated. You don't need to manually add it!

```typescript
// When you do this:
const { data, error } = await supabase
  .from('your_table')
  .select('*');

// Supabase automatically sends:
// Authorization: Bearer {access_token}
```

**Verification**:
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // ✅ All queries will include auth token
  // ✅ RLS policies will have access to auth.uid()
}
```

**Status**: ✅ **VERIFIED** - Auth token is automatically included

---

### ✅ 4. RLS Policies Configured

**Required Policies on Your Tables**:

For each table you want to access, you need RLS policies like:

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT
CREATE POLICY "Allow authenticated users to select"
  ON your_table
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert"
  ON your_table
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update"
  ON your_table
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to DELETE
CREATE POLICY "Allow authenticated users to delete"
  ON your_table
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
```

**For the `kv_store_a93d7fb4` table specifically**:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'kv_store_a93d7fb4';

-- If rowsecurity = false, enable it:
ALTER TABLE kv_store_a93d7fb4 ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Allow authenticated users full access"
  ON kv_store_a93d7fb4
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Status**: ⚠️ **NEEDS VERIFICATION** - You must configure this in Supabase

---

### ✅ 5. UI Maps to Database Operations

| UI Action | SQL Operation | Supabase Method |
|-----------|---------------|-----------------|
| Load data | SELECT | `.select()` |
| Edit row | UPDATE | `.update()` |
| Create row | INSERT | `.insert()` |
| Delete row | DELETE | `.delete()` |

**Status**: ✅ **IMPLEMENTED** - See RLS test page

---

## 🧪 Testing Procedure

### Step 1: Login to Your App

1. Go to `http://localhost:3000`
2. Login with email/password or magic link
3. You should be authenticated

### Step 2: Open RLS Test Page

1. Navigate to: `http://localhost:3000/#rls-test`
2. You should see the **Supabase RLS Test** page

### Step 3: Verify Auth Session

On the test page, check **Section 1: Auth Session Status**:

- [ ] ✅ Session: Active (green dot)
- [ ] ✅ User: Your email (green dot)
- [ ] ✅ Access Token: Shows token (first 30 chars)
- [ ] ✅ User ID: Shows UUID

**If you see red dots**: You're not authenticated. Go back and login first.

### Step 4: Discover Tables

Click **"Discover Tables"** button.

**Expected**:
- [ ] Should show `kv_store_a93d7fb4` table

**If error occurs**:
- Check console for error details
- Verify RLS policy exists (see Step 6)

### Step 5: Test SELECT Query

Click on the **kv_store_a93d7fb4** table.

**Expected Results**:

✅ **SUCCESS**:
- Displays table data in UI
- Shows row count and column names
- Console shows: `✅ SELECT success: X rows`
- Section 3 shows table with data

❌ **FAILURE - No Data**:
```
⚠️ No data returned. This could mean:
1. Table is empty
2. RLS policy is blocking access
3. Policy filters don't match current user
```

**Fix**: Configure RLS policy (see Step 6)

❌ **FAILURE - RLS Error**:
```
❌ RLS Policy Error: new row violates row-level security policy

Make sure you have a policy like:
CREATE POLICY "Allow authenticated users" ON kv_store_a93d7fb4
FOR ALL USING (auth.uid() IS NOT NULL);
```

**Fix**: Create permissive RLS policy in Supabase

### Step 6: Configure RLS Policy (If Needed)

If you get RLS errors, go to Supabase Dashboard:

1. **Navigate to**: https://supabase.com/dashboard/project/jqdmpwuzthojykzyhevh
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Paste this SQL:

```sql
-- Enable RLS on kv_store table
ALTER TABLE kv_store_a93d7fb4 ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for all authenticated users
CREATE POLICY "Allow authenticated users full access"
  ON kv_store_a93d7fb4
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

5. Click **"Run"**
6. Go back to RLS test page and try SELECT again

### Step 7: Test UPDATE Query

Once data is displayed:

1. Click **"Edit"** on any row
2. Modify a field (e.g., change the value)
3. Click **"Save"**

**Expected Results**:

✅ **SUCCESS**:
- Console shows: `✅ UPDATE success`
- Table data refreshes automatically
- Change is visible in UI
- Go to Supabase → Table Editor to verify change

❌ **FAILURE**:
- Check console for error
- Verify UPDATE policy exists
- Check that you have permission to update that row

**Verification in Supabase**:
1. Go to **Database** → **Tables** → `kv_store_a93d7fb4`
2. Find the row you edited
3. Verify the change is saved

### Step 8: Test INSERT Query (Optional)

To test creating new rows:

1. Modify the test component to enable INSERT
2. Fill in new row data
3. Click "Insert"

**Expected**:
- New row appears in table
- Console shows: `✅ INSERT success`
- Verify in Supabase Table Editor

### Step 9: Test DELETE Query (Optional)

To test deleting rows:

1. Click **"Delete"** on a test row
2. Confirm deletion

**Expected**:
- Row disappears from UI
- Console shows: `✅ DELETE success`
- Verify in Supabase Table Editor

### Step 10: Test Live Sync

**Two-Way Sync Verification**:

1. **Make → Supabase**:
   - Edit a row in Make UI
   - Go to Supabase Table Editor
   - Verify change is saved ✅

2. **Supabase → Make**:
   - Edit a row directly in Supabase Table Editor
   - Go back to Make RLS test page
   - Click "Refresh" or reload data
   - Verify change appears in Make UI ✅

---

## 📊 Success Criteria

- [x] **1️⃣ Global Client**: Supabase client initialized with URL + ANON_KEY
- [x] **2️⃣ Session Storage**: Auth session stored and persists
- [x] **3️⃣ Auth Token**: Automatically sent with all requests
- [ ] **4️⃣ RLS Policies**: Configured on tables (you must verify)
- [x] **5️⃣ SELECT Works**: Data loads in UI from Supabase
- [ ] **6️⃣ UPDATE Works**: Changes propagate to Supabase
- [ ] **7️⃣ INSERT Works**: New rows created in Supabase
- [ ] **8️⃣ DELETE Works**: Rows removed from Supabase
- [ ] **9️⃣ Live Sync**: Changes sync both directions

---

## 🐛 Troubleshooting

### Issue: "No authenticated user"

**Cause**: Not logged in or session expired

**Fix**:
1. Go to main app and login
2. Verify login worked
3. Go to `#rls-test` page
4. Should now show session

### Issue: "RLS Policy Error"

**Cause**: RLS is enabled but no policy allows access

**Fix**:
```sql
-- Create permissive policy
CREATE POLICY "Allow authenticated users"
  ON kv_store_a93d7fb4
  FOR ALL
  USING (auth.uid() IS NOT NULL);
```

### Issue: "No data returned" (but no error)

**Possible Causes**:

1. **Table is empty**
   - Fix: Insert test data in Supabase

2. **Policy filters user**
   ```sql
   -- If your policy is:
   USING (user_id = auth.uid())
   
   -- But rows don't have matching user_id
   -- You'll get empty result
   ```
   - Fix: Use permissive policy OR ensure rows match filter

3. **Wrong table**
   - Fix: Verify table name is correct

### Issue: "UPDATE/INSERT/DELETE fails"

**Cause**: Missing or restrictive RLS policy

**Fix**: Create policies for each operation:
```sql
-- Separate policies for fine-grained control
CREATE POLICY "Allow select" ON your_table FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow insert" ON your_table FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update" ON your_table FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete" ON your_table FOR DELETE USING (auth.uid() IS NOT NULL);
```

---

## 📝 Example Policies for Different Use Cases

### 1. Permissive (Allow All Authenticated Users)

```sql
CREATE POLICY "Allow all authenticated"
  ON your_table
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 2. User-Specific Rows (Users Can Only See Their Own Data)

```sql
-- Assuming table has a user_id column
CREATE POLICY "Users see own data"
  ON your_table
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own data"
  ON your_table
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own data"
  ON your_table
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 3. Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read"
  ON your_table
  FOR SELECT
  USING (true);

-- Only authenticated users can write
CREATE POLICY "Authenticated write"
  ON your_table
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## ✅ Final Verification

After completing all tests, confirm:

1. **Auth Session**: ✅ Active and token available
2. **SELECT**: ✅ Data loads from Supabase into UI
3. **UPDATE**: ✅ Changes in UI save to Supabase
4. **Live Sync**: ✅ Bidirectional sync confirmed

**Console Logs to Look For**:

```
✅ Session: Active
✅ User: user@example.com
🔍 SELECT * FROM kv_store_a93d7fb4...
✅ SELECT success: 42 rows (total: 42)
🔄 UPDATE kv_store_a93d7fb4 SET ...
✅ UPDATE success
```

---

## 🚀 Next Steps

Once validation passes:

1. ✅ Use Supabase client in your app components
2. ✅ Build CRUD interfaces with live sync
3. ✅ Configure fine-grained RLS policies per table
4. ✅ Add real-time subscriptions (optional):
   ```typescript
   supabase
     .channel('table-changes')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'your_table' },
       (payload) => {
         console.log('Change received!', payload)
       }
     )
     .subscribe()
   ```

---

**Validation Date**: ______________
**Tester**: ______________
**Status**: PASS / FAIL
**Notes**: ________________________________________
