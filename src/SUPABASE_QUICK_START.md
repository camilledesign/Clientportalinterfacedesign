# Supabase Integration Quick Start

## ✅ What's Already Configured

Your Supabase integration is **90% complete**! Here's what's working:

1. ✅ **Global Supabase Client** (`/utils/supabase/client.ts`)
   - Initialized with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Shared across entire app
   - Auto-includes auth token with requests

2. ✅ **Auth Session Management** (`/utils/auth.ts`)
   - Email/password login
   - Magic link (passwordless) login
   - Session persists across page refreshes
   - Token automatically sent with all database requests

3. ✅ **Database Utilities** (`/utils/supabase/db.ts`)
   - `selectFrom()` - SELECT queries
   - `insertInto()` - INSERT queries
   - `updateIn()` - UPDATE queries
   - `deleteFrom()` - DELETE queries
   - `upsertIn()` - UPSERT queries
   - KV store helpers: `kvGet()`, `kvSet()`, `kvDelete()`

4. ✅ **Test Page** (`http://localhost:3000/#rls-test`)
   - Validates auth session
   - Tests SELECT/UPDATE/INSERT/DELETE
   - Verifies RLS policies
   - Live data sync demonstration

## ⚠️ What You Need to Configure

### 1. Enable RLS and Create Policies

**In Supabase Dashboard** → **SQL Editor**, run:

```sql
-- Enable RLS on your kv_store table
ALTER TABLE kv_store_a93d7fb4 ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Allow authenticated users full access"
  ON kv_store_a93d7fb4
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

This allows any authenticated user to perform SELECT, INSERT, UPDATE, and DELETE on the `kv_store_a93d7fb4` table.

### 2. Verify the Connection

Go to: `http://localhost:3000/#rls-test`

1. Login if not already logged in
2. Click **"Discover Tables"**
3. Click on **kv_store_a93d7fb4**
4. Verify data loads ✅

If you see errors, check the `/SUPABASE_RLS_VALIDATION.md` guide for troubleshooting.

## 🚀 Using Supabase in Your App

### Basic Queries

```typescript
import { selectFrom, insertInto, updateIn, deleteFrom } from './utils/supabase/db';

// SELECT - Get all users
const { data: users, error } = await selectFrom('users');

// SELECT with filters
const { data: activeUsers } = await selectFrom('users', { status: 'active' });

// SELECT with options
const { data: recentUsers } = await selectFrom('users', {}, {
  orderBy: { column: 'created_at', ascending: false },
  limit: 10
});

// INSERT - Create new user
const { data: newUser } = await insertInto('users', {
  email: 'new@example.com',
  name: 'New User',
  status: 'active'
});

// UPDATE - Update user
const { data: updated } = await updateIn(
  'users',
  { id: '123' },
  { name: 'Updated Name' }
);

// DELETE - Delete user
const { error: deleteError } = await deleteFrom('users', { id: '123' });
```

### Direct Supabase Client

For advanced queries, use the client directly:

```typescript
import { supabase } from './utils/supabase/client';

// Complex query with joins
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(name, email),
    comments(count)
  `)
  .eq('published', true)
  .gte('created_at', '2025-01-01')
  .order('created_at', { ascending: false });

// Using filters
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .or('status.eq.published,status.eq.draft')
  .limit(10);
```

### Real-Time Subscriptions

```typescript
import { subscribeToTable } from './utils/supabase/db';

// Subscribe to changes
const unsubscribe = subscribeToTable('users', (payload) => {
  console.log('Change detected:', payload);
  
  if (payload.eventType === 'INSERT') {
    console.log('New user:', payload.new);
  }
  
  if (payload.eventType === 'UPDATE') {
    console.log('Updated:', payload.new);
  }
  
  if (payload.eventType === 'DELETE') {
    console.log('Deleted:', payload.old);
  }
});

// Later, unsubscribe
unsubscribe();
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { selectFrom } from './utils/supabase/db';
import { subscribeToTable } from './utils/supabase/db';

function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    loadUsers();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToTable('users', () => {
      // Reload data when changes occur
      loadUsers();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await selectFrom('users', {}, {
      orderBy: { column: 'created_at', ascending: false }
    });
    setUsers(data || []);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## 🔐 RLS Policy Examples

### Permissive (All Authenticated Users)

```sql
-- Allow all authenticated users full access
CREATE POLICY "Authenticated full access"
  ON your_table
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### User-Specific Data

```sql
-- Users can only see/edit their own rows
CREATE POLICY "Users own data"
  ON your_table
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Read-Only for Some, Write for Others

```sql
-- Everyone can read
CREATE POLICY "Public read"
  ON your_table
  FOR SELECT
  USING (true);

-- Only owner can write
CREATE POLICY "Owner write"
  ON your_table
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Role-Based Access

```sql
-- Admins can do anything
CREATE POLICY "Admin full access"
  ON your_table
  FOR ALL
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Regular users can only read
CREATE POLICY "User read"
  ON your_table
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'user'
  );
```

## 📊 Common Patterns

### Load Data in Component

```typescript
const [data, setData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    const { data: result } = await selectFrom('my_table');
    setData(result || []);
  };
  fetchData();
}, []);
```

### Create New Record

```typescript
const handleCreate = async () => {
  const { data, error } = await insertInto('my_table', {
    name: 'New Item',
    status: 'active'
  });

  if (error) {
    console.error('Failed to create:', error);
    return;
  }

  console.log('Created:', data);
  // Refresh list or add to state
};
```

### Update Record

```typescript
const handleUpdate = async (id: string, updates: any) => {
  const { data, error } = await updateIn(
    'my_table',
    { id },
    updates
  );

  if (error) {
    console.error('Failed to update:', error);
    return;
  }

  console.log('Updated:', data);
};
```

### Delete Record

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;

  const { error } = await deleteFrom('my_table', { id });

  if (error) {
    console.error('Failed to delete:', error);
    return;
  }

  console.log('Deleted successfully');
  // Remove from state or refresh list
};
```

## 🧪 Testing Checklist

- [ ] Login to app (`http://localhost:3000`)
- [ ] Go to RLS test page (`#rls-test`)
- [ ] Verify auth session shows as active
- [ ] Click "Discover Tables"
- [ ] Click on `kv_store_a93d7fb4` table
- [ ] Verify data loads (if RLS configured)
- [ ] Click "Edit" on a row
- [ ] Modify a value and click "Save"
- [ ] Verify change saved (check Supabase Table Editor)
- [ ] Refresh page - verify change persists

## 📚 Documentation Files

- **`/SUPABASE_RLS_VALIDATION.md`** - Complete validation guide
- **`/utils/supabase/db.ts`** - Database utility functions
- **`/utils/supabase/client.ts`** - Supabase client initialization
- **`/utils/auth.ts`** - Authentication functions
- **`/components/SupabaseRLSTest.tsx`** - Test component

## 🎯 Summary

**What Works Now**:
- ✅ Supabase client initialized
- ✅ Auth session managed automatically
- ✅ Auth token sent with all requests
- ✅ Helper functions for CRUD operations
- ✅ Test page to validate connection

**What You Need to Do**:
1. Configure RLS policies in Supabase (see SQL above)
2. Test SELECT/UPDATE on RLS test page
3. Start using Supabase in your components

**Quick Test**:
```typescript
// In any component
import { selectFrom } from './utils/supabase/db';

const { data, error } = await selectFrom('kv_store_a93d7fb4');
console.log('Data:', data);
```

That's it! Your Supabase integration is ready to use. 🎉
