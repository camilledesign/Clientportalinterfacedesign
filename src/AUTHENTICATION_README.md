# Supabase Auth Integration

## Overview

This application now uses **Supabase Auth** for user authentication, ensuring that:
- ✅ Exactly **ONE row per user** in `kv_store` (no duplicates on login)
- ✅ Users are stored with a stable key: `user:{supabaseAuthUserId}`
- ✅ Clients are stored with key: `client:{clientId}`
- ✅ Support for both **email/password** and **magic link** authentication

## Architecture

### Database Schema

The `public.kv_store_a93d7fb4` table has:
- `key` (TEXT, PRIMARY KEY) - Unique identifier
- `value` (JSONB) - JSON data

### User Storage Format

**Key**: `user:{supabaseAuthUserId}`

**Value**:
```json
{
  "id": "supabase-auth-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "company": "Company Name",
  "clientId": "client-uuid",
  "status": "active",
  "createdAt": "2025-11-22T10:00:00.000Z",
  "lastLoginAt": "2025-11-22T15:30:00.000Z"
}
```

### Client Storage Format

**Key**: `client:{clientId}`

**Value**:
```json
{
  "id": "client-uuid",
  "name": "Company Name",
  "email": "user@example.com",
  "createdAt": "2025-11-22T10:00:00.000Z",
  "lastActivity": "2025-11-22T15:30:00.000Z",
  "activeRequests": 0,
  "status": "active"
}
```

## Authentication Flow

### 1. User Signs In (Email/Password or Magic Link)

**Frontend** (`/utils/auth.ts`):
```typescript
// Email/Password
await signInWithPassword(email, password);

// Magic Link
await signInWithMagicLink(email);
```

### 2. Initialize User Profile

After successful Supabase Auth, `initUserProfile()` is called:

```typescript
export async function initUserProfile() {
  // 1. Get authenticated user from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Build user profile data
  const userProfile = {
    id: user.id,  // Supabase Auth ID (stable)
    email: user.email,
    name: user.user_metadata?.name || 'User',
    company: user.user_metadata?.company || 'Company',
    clientId: clientId,
    status: 'active',
    lastLoginAt: new Date().toISOString(),
  };
  
  // 3. Send to backend for upsert
  await fetch('/users/init-profile', {
    method: 'POST',
    headers: {
      'X-User-Token': user.id,
    },
    body: JSON.stringify(userProfile),
  });
}
```

### 3. Backend Upsert

**Backend** (`/supabase/functions/server/index.tsx`):

```typescript
app.post("/make-server-a93d7fb4/users/init-profile", async (c) => {
  const userId = c.req.header('X-User-Token');
  const { id, email, name, company, clientId, lastLoginAt } = await c.req.json();

  // Build stable key
  const userKey = `user:${id}`;
  
  // Check if user exists
  const existingUser = await kv.get(userKey);
  
  if (existingUser) {
    // UPDATE existing user (only lastLoginAt)
    await kv.set(userKey, {
      ...existingUser,
      lastLoginAt,
    });
  } else {
    // INSERT new user
    await kv.set(userKey, {
      id, email, name, company, clientId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt,
    });
    
    // Also create client record
    await kv.set(`client:${clientId}`, { ... });
  }
});
```

### 4. The Upsert Mechanism

The `kv_store.tsx` already uses Supabase's **upsert** method:

```typescript
export const set = async (key: string, value: any): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from("kv_store_a93d7fb4").upsert({
    key,
    value
  });
  if (error) throw new Error(error.message);
};
```

This ensures:
- If `key` exists → **UPDATE** the value
- If `key` doesn't exist → **INSERT** a new row
- **NO DUPLICATES** because `key` is a PRIMARY KEY

## Key Benefits

### 1. No Duplicate Rows
- Each login updates `lastLoginAt` on the **same row**
- The key `user:{supabaseAuthUserId}` is stable and unique

### 2. Supabase Auth Integration
- Built-in email verification
- Password reset flows
- Magic link authentication
- Social OAuth (Google, GitHub, etc.) - ready to enable

### 3. Scalable Architecture
- Supabase Auth handles password hashing, sessions, JWTs
- Your app only stores profile metadata in `kv_store`
- Easy to add more user fields without touching auth logic

## Migration from Legacy System

### Legacy Format (OLD)
- **Key**: `user:{email}`
- **Problem**: Uses email as key, doesn't integrate with Supabase Auth

### New Format
- **Key**: `user:{supabaseAuthUserId}`
- **Solution**: Uses stable Supabase Auth ID

### Migration Steps

1. **Admin creates users in Supabase Auth**:
   ```sql
   -- In Supabase SQL Editor or Dashboard
   INSERT INTO auth.users (email, encrypted_password, ...)
   ```

2. **Users sign in with Supabase Auth**:
   - First login creates `user:{supabaseAuthId}` record
   - Old `user:{email}` records can be deleted

3. **Use Migration Button** (Admin Panel):
   - Go to Admin Panel
   - Click "Migrate Legacy Users"
   - Converts all `user:{email}` → `user:{id}` format

## Testing

### Test Login Flow

1. **Create a test user in Supabase Auth**:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User"
   - Enter email and password
   - Auto-confirm email

2. **Sign in multiple times**:
   ```bash
   # Login 1
   # Check database: should see 1 user row + 1 client row
   
   # Login 2 
   # Check database: still 1 user row (lastLoginAt updated)
   
   # Login 3
   # Check database: still 1 user row (no duplicates!)
   ```

3. **Verify in Supabase**:
   - Go to Database → Tables → `kv_store_a93d7fb4`
   - Filter by key like `user:%`
   - Should see ONE row per user ID

## Environment Setup

### Required Supabase Settings

1. **Auth Settings** (Supabase Dashboard → Authentication → Settings):
   - Enable Email Provider
   - Configure Email Templates (optional)
   - Set Site URL to your app URL

2. **For Magic Link**:
   - Enable "Email OTP" in Auth Providers
   - Configure redirect URL

3. **For Social OAuth** (optional):
   - Enable provider (Google, GitHub, etc.)
   - Add OAuth credentials
   - Users must follow setup docs: https://supabase.com/docs/guides/auth/social-login

## API Endpoints

### User Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users/init-profile` | POST | Upsert user profile after auth |
| `/users/check-client` | POST | Check if client exists for email |

### Auth Endpoints (Legacy - for backward compatibility)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/signin` | POST | Legacy email/password signin |
| `/auth/verify` | POST | Verify user session |
| `/auth/signout` | POST | Sign out user |

## Frontend Usage

### Sign In with Password
```typescript
import { signInWithPassword } from './utils/auth';

await signInWithPassword('user@example.com', 'password123');
```

### Sign In with Magic Link
```typescript
import { signInWithMagicLink } from './utils/auth';

await signInWithMagicLink('user@example.com');
// User receives email with magic link
// Clicking link signs them in automatically
```

### Sign Up (Optional)
```typescript
import { signUpWithPassword } from './utils/auth';

await signUpWithPassword('user@example.com', 'password123', {
  name: 'John Doe',
  company: 'Acme Inc'
});
```

### Check Auth Status
```typescript
import { isAuthenticated, getCurrentUser } from './utils/auth';

const isAuth = await isAuthenticated();
const user = await getCurrentUser();
```

### Sign Out
```typescript
import { signOut } from './utils/auth';

await signOut();
```

## Troubleshooting

### Issue: User row created on every login

**Cause**: Not using Supabase Auth, or `initUserProfile()` not using stable user ID

**Fix**: Ensure you're calling `signInWithPassword()` or `signInWithMagicLink()`, which automatically calls `initUserProfile()` with the correct Supabase Auth user ID.

### Issue: Magic link not working

**Cause**: Site URL not configured in Supabase

**Fix**: Go to Supabase Dashboard → Authentication → URL Configuration → Set Site URL to your app URL (e.g., `https://your-app.com`)

### Issue: "User already exists" when creating client

**Cause**: Trying to create a new client with an email that's already in use

**Fix**: This is expected behavior. Each email can only have one user account.

## Next Steps

1. ✅ **Done**: Supabase Auth integration
2. ✅ **Done**: Upsert logic to prevent duplicates
3. ✅ **Done**: Magic link support
4. 🔜 **Optional**: Enable social OAuth (Google, GitHub)
5. 🔜 **Optional**: Add email verification requirement
6. 🔜 **Optional**: Add password reset flow UI

## Summary

✅ **One row per user** - No duplicates on login
✅ **Stable key format** - `user:{supabaseAuthId}`
✅ **Supabase Auth** - Industry-standard authentication
✅ **Upsert logic** - Updates existing records on login
✅ **Magic link support** - Passwordless authentication option
✅ **Backward compatible** - Legacy auth still works during migration

---

**Questions?** Check the code in:
- `/utils/auth.ts` - Frontend auth functions
- `/supabase/functions/server/index.tsx` - Backend endpoints
- `/supabase/functions/server/kv_store.tsx` - Upsert implementation
