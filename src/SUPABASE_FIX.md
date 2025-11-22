# Supabase Fix Instructions

The error `AuthApiError: Database error querying schema` means a **Database Trigger** is failing.
This happens when an automated trigger (likely setup previously) tries to write data to a table that is missing, has a schema mismatch, or has a permissions issue.

## 🛠️ Solution

Run the following SQL in your Supabase Dashboard (SQL Editor) to clean up any broken triggers and ensure the `profiles` table is correctly set up.

```sql
-- 1. Fix Schema Permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;

-- 2. Drop potential conflicting triggers/functions
-- These are common legacy trigger names that might be failing
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_new_user_profile();
-- Note: If you named your trigger something else, please manually check "Database > Triggers" in Supabase and delete any triggers on auth.users.

-- 3. Ensure Profiles Table Exists (Idempotent)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  company text,
  client_id text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Re-Enable RLS
alter table profiles enable row level security;

-- 5. Reset Policies (Drops existing ones to avoid conflicts)
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- 6. Create RLS Policies
create policy "Users can view own profile" on profiles for select using ( id = auth.uid() );
create policy "Users can update own profile" on profiles for update using ( id = auth.uid() );
create policy "Users can insert own profile" on profiles for insert with check ( id = auth.uid() );
```

## How to Run
1. Go to your **Supabase Dashboard**.
2. Click on **SQL Editor** (on the left sidebar).
3. Click **New Query**.
4. Paste the code above.
5. Click **Run**.
6. Go back to the app and try to **Sign In** again.
