# 📝 Supabase Notes Setup

## Overview

This document provides the SQL commands to add a `notes` column to the `public.profiles` table for admin-side client notes storage.

---

## SQL Migration

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Add notes column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.notes IS 'Admin-only notes about this client. Not visible to the client.';
```

That's it! No RLS policy changes needed since:
- Notes are stored in the same `profiles` table
- Existing RLS policies already allow:
  - Users to view their own profile (but notes are admin-only in the UI)
  - Admins to view/update all profiles

---

## How It Works

### Admin Side

When an admin views a client in the admin panel:

1. Admin navigates to **Client Detail → Notes tab**
2. Textarea is populated with `client.notes` (from profiles table)
3. Admin can edit the notes
4. Click "Save Notes" → Calls `updateClient(clientId, { notes })`
5. Notes are saved to `public.profiles.notes` column

### Client Side

Clients **do not see** notes. The notes field is intentionally hidden from client views.

---

## Implementation Details

### Database Schema Addition

| Column | Type | Description |
|--------|------|-------------|
| `notes` | TEXT | Admin-only notes about the client |

### API Functions

**File:** `/utils/api.ts`

```typescript
// Currently throws "not implemented" error
export async function updateClient(clientId: string, updates: any) {
  // TODO: Implement with Supabase update
  // Should call: supabase.from('profiles').update(updates).eq('id', clientId)
}
```

**Implementation needed:**
- Add proper `updateClient` implementation in `/utils/api.ts`
- Should use `updateIn` from `/utils/supabase/db.ts` or direct Supabase update

### Component Usage

**File:** `/components/admin/AdminClientDetail.tsx`

```typescript
const [notes, setNotes] = useState('');
const [savingNotes, setSavingNotes] = useState(false);

const handleSaveNotes = async () => {
  try {
    setSavingNotes(true);
    await updateClient(clientId, { notes });
    alert('✅ Notes saved successfully!');
  } catch (error: any) {
    alert(`❌ Failed to save notes: ${error.message}`);
  } finally {
    setSavingNotes(false);
  }
};
```

---

## Testing

1. Run the SQL migration above
2. Implement `updateClient` in `/utils/api.ts`
3. As admin, navigate to a client → Notes tab
4. Add/edit notes
5. Click "Save Notes"
6. Refresh the page → Notes should persist
7. Log in as that client → Notes should NOT be visible

---

## Future Enhancements

1. **Rich Text Editor** - Add markdown or WYSIWYG editor for notes
2. **Notes History** - Track changes to notes over time
3. **Multiple Notes** - Create separate `notes` table with timestamps
4. **Note Tags** - Categorize notes (billing, support, technical, etc.)
5. **Search** - Full-text search across all client notes
6. **Reminders** - Set follow-up reminders based on notes

---

Last Updated: November 23, 2024
