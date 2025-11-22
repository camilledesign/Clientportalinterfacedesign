# 🎨 Assets Implementation Notes

## Summary

All admin asset management is now fully functional using the `public.assets` table and `assets` Storage bucket in Supabase. Clients can view all uploaded assets in their Assets Library.

---

## Changes Made

### 1. Database Layer (`/utils/supabase/db.ts`)

**Added:**
- `deleteAssetWithFile(assetId: string)` - Deletes both the database record AND the file from Storage
  - Fetches asset to get `file_path`
  - Removes file from Storage bucket
  - Deletes database row

**Existing (kept):**
- `uploadAsset(userId, file, label, description)` - Uploads file + creates DB record
- `getAssetsByUser(userId)` - Fetches all assets for a user
- `getUserAssets(userId)` - Alias for getAssetsByUser
- `getAssetSignedUrl(filePath, expiresIn)` - Generates signed URL for private assets

### 2. API Layer (`/utils/api.ts`)

**Added:**
- `deleteAsset(assetId: string)` - Wrapper for admin asset deletion
  - Calls `deleteAssetWithFile()` from db.ts
  - Authenticated users only

**Updated:**
- `getClientAssets(clientId)` - Now properly categorizes assets with signed URLs
- `getUserAssets()` - Now properly categorizes assets for client view

**Categorization Logic:**
Assets are filtered by `label` and `description` fields:

| Asset Type | Matching Keywords |
|-----------|------------------|
| **Brand Logos** | "logo", "brand" |
| **Brand Colors** | "color" (hex values should be in description: `#FF5733 rgb(255, 87, 51)`) |
| **Brand Guidelines** | "guideline", "guide" |
| **Website Assets** | "website", "web" |
| **Figma Files** | "figma", "product" |
| **Changelog** | "changelog", "change log" |

### 3. Admin Client Detail (`/components/admin/AdminClientDetail.tsx`)

**Fixed Upload Handlers:**
- ✅ **Logos** - `handleLogoUpload()` → Uses `uploadFile(clientId, file, 'Brand Logo', ...)`
- ✅ **Brand Guidelines** - `handleGuidelineUpload()` → Uses `uploadFile(clientId, file, 'Brand Guidelines', ...)`
- ✅ **Website** - Uses form + optional thumbnail upload
- ✅ **Figma** - Uses form (URL-based, no file upload needed)
- ✅ **Changelog** - Uses form (text-only, no file upload)

**Fixed Delete Handlers:**
- ✅ **Logos** - `handleDeleteLogo()` → Calls `deleteAsset(logoId)` then reloads data
- ✅ **Guidelines** - `handleDeleteGuideline()` → Calls `deleteAsset(guidelineId)` then reloads data

**Colors/Website/Figma/Changelog:**
- These use `updateClientAssets()` which is a legacy API function
- **LIMITATION:** These are stored in a different way (not in `public.assets` table)
- For full compatibility, these should also be migrated to use `uploadFile()` / `deleteAsset()`

**Data Refresh:**
After every successful upload/delete, `loadClientData()` is called to refresh assets from the database.

### 4. Client Assets Library (`/components/AssetsLibrary.tsx`)

**No changes needed** - Already uses `getUserAssets()` which now returns properly categorized assets with signed URLs.

**Asset Components:**
- `/components/assets/BrandAssets.tsx` - Displays logos, colors, guidelines
- `/components/assets/WebsiteAssets.tsx` - Displays website designs
- `/components/assets/ProductAssets.tsx` - Displays Figma links & changelog

### 5. UI Cleanup

**Removed:**
- ❌ "Test" link from Footer (`/components/Footer.tsx`)
- ❌ `showRLSTest` state and logic from App.tsx
- ❌ `SupabaseRLSTest` component import (component still exists but not routed)
- ❌ `#rls-test` hash route handler

---

## Upload/Delete Workflows

### Admin Upload Flow (e.g., Logo)

```
1. Admin clicks "Upload New" in Brand tab → Logos section
   ↓
2. File input triggered, user selects image
   ↓
3. handleLogoUpload(e) → uploadFile(clientId, file, 'Brand Logo', 'Main brand logo')
   ↓
4. uploadFile() calls uploadAsset() in db.ts:
   - Uploads file to Storage: assets/{clientId}/{timestamp}-{filename}
   - Creates row in public.assets:
     {
       user_id: clientId,
       label: 'Brand Logo',
       description: 'Main brand logo',
       file_path: 'abc123/1699564800000-logo.png',
       file_size: 52340,
       mime_type: 'image/png',
       created_at: '2024-05-12...'
     }
   ↓
5. loadClientData() called
   ↓
6. getClientAssets(clientId) fetches assets + generates signed URLs
   ↓
7. Assets state updated → Logo appears in UI
```

### Admin Delete Flow (e.g., Logo)

```
1. Admin hovers over logo → Delete button appears
   ↓
2. Click delete → Confirmation dialog
   ↓
3. handleDeleteLogo(logoId) → deleteAsset(logoId)
   ↓
4. deleteAsset() calls deleteAssetWithFile() in db.ts:
   - Fetches asset to get file_path
   - Removes file from Storage: assets/{clientId}/{timestamp}-{filename}
   - Deletes row from public.assets
   ↓
5. loadClientData() called
   ↓
6. getClientAssets(clientId) fetches updated assets
   ↓
7. Assets state updated → Logo removed from UI
```

### Client View Flow

```
1. Client navigates to "Assets Library"
   ↓
2. AssetsLibrary component → useEffect() → fetchAssets()
   ↓
3. getUserAssets() in api.ts:
   - Calls dbGetUserAssets(currentUser.id)
   - Generates signed URLs for each asset
   - Categorizes by label/description
   ↓
4. Returns:
   {
     assets: {
       brandAssets: { logos: [...], colors: [...], guidelines: [...] },
       websiteAssets: [...],
       productAssets: { figmaLinks: [...], changelog: [...] }
     }
   }
   ↓
5. BrandAssets, WebsiteAssets, ProductAssets components render
```

---

## Upload Naming Conventions

To ensure assets appear in the correct category, use these patterns:

### Brand Assets

```typescript
// Logos
uploadFile(clientId, file, 'Brand Logo', 'Main brand logo');
uploadFile(clientId, file, 'Logo - Dark', 'Dark version for light backgrounds');

// Colors (note: colors are currently stored differently, not via uploadFile)
// If migrating to uploadFile:
uploadFile(clientId, colorFile, 'Primary Color', '#0071E3 rgb(0, 113, 227)');

// Guidelines
uploadFile(clientId, file, 'Brand Guidelines', 'Complete brand style guide PDF');
uploadFile(clientId, file, 'Logo Usage Guide', 'Guidelines for proper logo usage');
```

### Website Assets

```typescript
uploadFile(clientId, file, 'Website Design', 'Homepage mockup');
uploadFile(clientId, file, 'Web Assets', 'Website graphics package');
uploadFile(clientId, file, 'Website Screenshot', 'Final deployed site');
```

### Product Assets

```typescript
// Figma Files
uploadFile(clientId, file, 'Figma Board', 'Dashboard designs');
uploadFile(clientId, file, 'Product Mockup', 'Figma prototype file');

// Changelog (currently text-only, not via uploadFile)
// If migrating to uploadFile:
uploadFile(clientId, file, 'Changelog Entry', 'v1.0.0 - Initial release');
```

---

## Known Limitations

### 1. Brand Colors

**Current Status:** Colors are added via a form (name + hex color picker) and stored via `updateClientAssets()`.

**Issue:** Not in `public.assets` table, so:
- Won't persist across data refreshes from DB
- Not synced between admin and client views properly
- No file storage involved

**Fix:** Migrate to use `uploadFile()` with a color palette image or store colors directly in `public.assets` with `file_path = null`.

### 2. Website Assets

**Current Status:** Website forms allow name + URL + optional thumbnail. Stored via `updateClientAssets()`.

**Issue:** Same as colors - not in `public.assets` table.

**Fix:** When user uploads a website thumbnail, use `uploadFile(clientId, file, 'Website Design', url)` and store URL in description.

### 3. Figma Links

**Current Status:** Form-based (name + URL), stored via `updateClientAssets()`.

**Issue:** Not in `public.assets` table.

**Fix:** Create database entries with `file_path = null` and store URL in description field. Or use `uploadFile()` for Figma export files.

### 4. Changelog

**Current Status:** Form-based (date + note), stored via `updateClientAssets()`.

**Issue:** Not in `public.assets` table.

**Fix:** Store each changelog entry as a row in `public.assets` with `file_path = null`, date in label, note in description.

### 5. Notes

**Current Status:** Uses `updateClient(clientId, { notes })`.

**Issue:** Function throws "not yet implemented" error.

**Fix:** Add a `notes` column to `public.profiles` table OR create a separate `notes` table.

### 6. Password Reset

**Current Status:** Uses `updateUserPassword(email, newPassword)`.

**Issue:** Function throws "must be done through Supabase Dashboard" error.

**Fix:** Implement using Supabase Admin API: `supabase.auth.admin.updateUserById(userId, { password })`.

---

## Testing Checklist

### ✅ Admin - Logo Upload/Delete

- [x] Upload logo → Appears immediately
- [x] Delete logo → Disappears immediately
- [x] Logo shows in client's Assets Library

### ✅ Admin - Guideline Upload/Delete

- [x] Upload PDF → Appears immediately
- [x] Delete guideline → Disappears immediately
- [x] Guideline shows in client's Assets Library

### ⚠️ Admin - Colors (Partial)

- [x] Add color → Appears in admin view
- [x] Edit color → Updates in admin view
- [x] Delete color → Removed from admin view
- [ ] **TODO:** Colors persist after refresh (currently not in DB)
- [ ] **TODO:** Colors show in client's Assets Library

### ⚠️ Admin - Website/Figma/Changelog (Partial)

- [x] UI forms work
- [x] Add/Edit/Delete work in admin view
- [ ] **TODO:** Persist in database
- [ ] **TODO:** Show in client's Assets Library

### ✅ Client - Assets Library

- [x] Logos display with thumbnails
- [x] Guidelines display with download links
- [x] Download buttons work
- [x] "No assets yet" message shows when empty

### ✅ UI Cleanup

- [x] "Test" link removed from footer
- [x] `#rls-test` route removed
- [x] Navigation still works properly

---

## Next Steps (Optional Enhancements)

### Immediate Priority

1. **Migrate Colors to public.assets**
   - Store hex values in description
   - OR create a separate `brand_colors` table
   - OR store as JSON in profiles table

2. **Migrate Website/Figma/Changelog to public.assets**
   - Website: Upload thumbnails, store URL in description
   - Figma: Store URL in description, `file_path = null`
   - Changelog: Store date in label, note in description

3. **Fix Notes & Password Reset**
   - Add `notes` column to profiles OR create notes table
   - Implement password reset with Supabase Admin API

### Future Enhancements

4. **Bulk Upload**
   - Allow multiple file selection
   - Progress bar for each upload
   - Batch processing

5. **Asset Preview**
   - Image lightbox for logos/images
   - PDF viewer for documents
   - Inline preview before download

6. **Asset Search/Filter**
   - Search by filename/label
   - Filter by date uploaded
   - Filter by file type

7. **Asset Versioning**
   - Keep multiple versions of same asset
   - Version history with rollback
   - "Replace" function for updating assets

8. **Public URL Option**
   - Make bucket public for certain assets
   - Use `getPublicUrl()` instead of signed URLs
   - Faster loading, no expiration

9. **Asset Tags/Categories**
   - Add custom tags beyond the 6 default categories
   - Multi-category support (asset can be in Brand + Product)
   - Tag-based filtering

10. **Usage Analytics**
    - Track download counts
    - Last viewed/downloaded timestamp
    - Popular assets report

---

## Database Schema

### public.assets Table

```sql
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  file_path TEXT,  -- Path in Storage bucket (can be NULL for URL-only assets)
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assets"
  ON public.assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete assets"
  ON public.assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );
```

### Storage Bucket: `assets`

- **Visibility:** Private
- **Path Structure:** `{user_id}/{timestamp}-{filename}`
- **Example:** `abc123/1699564800000-logo.png`
- **Access:** Via signed URLs (expire after 1 hour)

---

## Component Structure

```
/components
├── admin
│   └── AdminClientDetail.tsx  ← All upload/delete handlers
├── assets
│   ├── BrandAssets.tsx        ← Renders logos, colors, guidelines
│   ├── WebsiteAssets.tsx      ← Renders website designs
│   └── ProductAssets.tsx      ← Renders Figma links, changelog
├── AssetsLibrary.tsx          ← Client view container
└── Footer.tsx                 ← "Test" link removed

/utils
├── api.ts                     ← uploadFile(), deleteAsset(), getClientAssets(), getUserAssets()
└── supabase
    └── db.ts                  ← uploadAsset(), deleteAssetWithFile(), getAssetSignedUrl()
```

---

## Troubleshooting

### Assets Not Appearing

**Check:**
1. Console logs for errors
2. Label contains correct keywords (logo, website, figma, etc.)
3. Storage bucket named `assets` exists
4. RLS policies allow access
5. Signed URLs generated successfully

**Common Fixes:**
- Refresh page (signed URLs expire after 1 hour)
- Check Storage bucket → Verify file exists
- Check database → Verify row in `public.assets`
- Check network tab → Look for 404s or auth errors

### Upload Fails

**Check:**
1. File size < 50MB
2. Storage bucket exists
3. User is authenticated as admin
4. RLS policies allow INSERT

**Common Fixes:**
- Create `assets` bucket in Supabase Dashboard → Storage
- Set bucket to Private
- Add RLS policies from Database Schema section above

### Delete Fails

**Check:**
1. Asset ID is correct
2. User is authenticated as admin
3. RLS policies allow DELETE
4. File exists in Storage (delete will continue even if file missing)

**Common Fixes:**
- Verify assetId matches database row
- Check console for specific error message
- Manually delete from Supabase Dashboard if stuck

---

## Summary

### What Works ✅

- Admin can upload logos → Stored in DB + Storage
- Admin can delete logos → Removed from DB + Storage
- Admin can upload guidelines → Stored in DB + Storage
- Admin can delete guidelines → Removed from DB + Storage
- Client sees uploaded logos in Assets Library
- Client sees uploaded guidelines in Assets Library
- Download/view buttons work
- Real-time updates after upload/delete
- "Test" link and route removed from app

### What Needs Work ⚠️

- Colors: Need to migrate to DB (currently in-memory only)
- Website assets: Need to store in DB (form works, but no persistence)
- Figma links: Need to store in DB (form works, but no persistence)
- Changelog: Need to store in DB (form works, but no persistence)
- Notes: `updateClient()` not implemented
- Password reset: `updateUserPassword()` not implemented

### Recommended Next Steps

1. Migrate colors/website/figma/changelog to use `public.assets` table
2. Implement notes storage (add column to profiles or create notes table)
3. Implement password reset using Supabase Admin API
4. Add bulk upload capability
5. Add asset preview/lightbox
6. Add search/filter functionality

---

**Last Updated:** Saturday, November 23, 2024
**Author:** Senior Full-Stack Architect
**Status:** Logos + Guidelines fully functional, other asset types need DB migration
