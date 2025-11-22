# 🧪 Quick Testing Guide - Asset Display

## Prerequisites

✅ Supabase project: `xnemdsxpxewvgluhczoh`  
✅ Tables created: `public.profiles`, `public.requests`, `public.assets`  
✅ Storage bucket created: `assets` (private)  
✅ At least one admin user (with `is_admin = true` in profiles)  
✅ At least one regular client user

---

## Test Scenario 1: Admin Upload → Admin View

### Steps:
1. **Login as admin**
   - Email: your-admin@example.com
   - Password: your-password

2. **Navigate to Admin Dashboard**
   - Click on a client's name in the table

3. **Upload a Brand Logo**
   - Click "Brand" tab
   - Under "Logos" section, click "Upload New"
   - Select any image file (PNG, JPG, or SVG)
   - Wait for success message

### Expected Results:
✅ Upload completes without "Bucket not found" error  
✅ Success alert appears: "✅ Logo uploaded successfully!"  
✅ Page automatically refreshes  
✅ Uploaded logo appears in the Logos grid:
   - Thumbnail displays correctly
   - Logo name shows
   - File format badge shows (PNG, JPG, SVG)
✅ Download button works (opens file in new tab)

### Check Console:
```
🔵 Uploading logo for client: {clientId}
✅ Logo uploaded successfully: {result}
🔄 Loading client data for ID: {clientId}
✅ Assets data loaded: {assetsData}
```

---

## Test Scenario 2: Client View Assets

### Steps:
1. **Logout from admin account**

2. **Login as the client** (the one you uploaded assets for)
   - Email: client@example.com
   - Password: client-password

3. **Navigate to Assets Library**
   - Click "Assets Library" in left sidebar

4. **Check Brand Tab**
   - Should be selected by default
   - Look for uploaded logos

### Expected Results:
✅ No "No Brand Assets Yet" message  
✅ Logos appear in grid layout  
✅ Thumbnails load correctly  
✅ Logo names display  
✅ File format badges show  
✅ Download buttons work  

### Check Console:
```
🔵 AssetsLibrary: Fetching assets...
✅ AssetsLibrary: Fetched assets: {assets}
```

---

## Test Scenario 3: Submit Brief → View History

### Steps:
1. **As client, click "New Request"**

2. **Select "Brand" request type**

3. **Fill out the form:**
   - Brand Name: "Test Company"
   - Request Type: "New brand"
   - Brief Details: "Need a new logo and color palette"

4. **Click "Submit Request"**
   - Wait for success message

5. **Navigate to "Request History"**
   - Click "Request History" in sidebar

### Expected Results:
✅ Success message after submission  
✅ Request appears in Request History:
   - Purple "Brand" badge
   - Orange "New" status badge
   - Today's date
   - "View Brief" button works
✅ No "No past requests yet" message

---

## Test Scenario 4: Multiple Asset Types

### Steps:
1. **Login as admin**

2. **Upload different asset types for the same client:**

   **Brand Logo:**
   - File: logo.png
   - Will appear in: Brand → Logos

   **Website Design:**
   - File: website-mockup.jpg
   - Label it with "website" keyword
   - Will appear in: Website tab

   **Figma Link/File:**
   - File: figma-design.png
   - Label it with "figma" keyword
   - Will appear in: Product → Figma Files

3. **Check each tab**
   - Brand tab → See logo
   - Website tab → See website design
   - Product tab → See Figma file

### Expected Results:
✅ Each asset appears in correct tab  
✅ Categorization works based on labels  
✅ All download links work  

---

## Test Scenario 5: Real-time Updates

### Steps:
1. **Admin: Upload a new logo** (don't close admin panel)

2. **Immediately check:**
   - Logo should appear in admin view without manual refresh

3. **Client: Refresh Assets Library page**
   - New logo should now appear for client too

### Expected Results:
✅ Admin sees asset immediately after upload  
✅ Client sees asset after page refresh  
✅ No delays or missing assets  

---

## Common Issues & Solutions

### Issue: "Bucket not found"
**Solution:**
1. Go to Supabase Dashboard → Storage
2. Create new bucket named `assets`
3. Set visibility to "Private"
4. Save and try upload again

### Issue: Assets uploaded but not displaying
**Solution:**
1. Check browser console for errors
2. Look for signed URL errors
3. Verify label contains keywords: "logo", "brand", "website", "product", "figma"
4. Check Storage bucket → Verify file exists at path: `{userId}/{timestamp}-{filename}`

### Issue: "Not authenticated" errors
**Solution:**
1. Logout and login again
2. Check session is valid
3. Verify user exists in `public.profiles` table

### Issue: Thumbnails not loading
**Solution:**
1. Wait a moment (signed URLs may take a second to generate)
2. Refresh page
3. Check console for signed URL errors
4. Verify Storage bucket is accessible

### Issue: Download button does nothing
**Solution:**
1. Check if URL is valid (look in browser console)
2. Signed URLs expire after 1 hour - refresh page
3. Check browser didn't block popup (allow popups for your domain)

---

## Quick Console Checks

### Check if assets are in database:
```sql
SELECT id, label, description, file_path, created_at 
FROM public.assets 
WHERE user_id = 'client-user-id';
```

### Check if files are in Storage:
1. Supabase Dashboard → Storage → `assets` bucket
2. Look for folder with client's user ID
3. Files should be named: `{timestamp}-{original-filename}`

### Check user's profile:
```sql
SELECT id, full_name, email, is_admin 
FROM public.profiles 
WHERE email = 'client@example.com';
```

---

## Success Criteria

### ✅ Admin Flow Complete When:
- Admin can upload files without errors
- Uploaded files appear immediately in admin view
- Download buttons work
- All tabs (Brand/Website/Product) load without errors

### ✅ Client Flow Complete When:
- Client can see their uploaded assets
- Assets display with thumbnails
- Download/view buttons work
- Request History shows submitted briefs
- No empty states when assets exist

### ✅ End-to-End Complete When:
- Admin uploads asset → Asset appears in admin view
- Client refreshes → Asset appears in client view
- Client submits brief → Brief appears in Request History
- No console errors
- All signed URLs resolve correctly

---

## Performance Check

### Expected Load Times:
- Initial asset fetch: < 2 seconds
- Signed URL generation (10 assets): < 1 second
- Upload (5MB file): < 5 seconds
- Page navigation: < 500ms

### If Slower:
- Check Supabase region latency
- Check image file sizes (optimize if > 5MB)
- Check browser network tab for slow requests
- Verify RLS policies aren't causing table scans

---

## Final Verification

Run through this checklist:

- [ ] Admin can login
- [ ] Admin can see client list
- [ ] Admin can open client detail
- [ ] Admin can upload logo (Brand tab)
- [ ] Logo appears immediately after upload
- [ ] Client can login
- [ ] Client can navigate to Assets Library
- [ ] Client sees uploaded logo
- [ ] Download button works for client
- [ ] Client can submit a brief
- [ ] Brief appears in Request History
- [ ] No console errors anywhere
- [ ] All images load properly
- [ ] Signed URLs work correctly

### If ALL checkboxes are checked: ✅ **Implementation Successful!**

---

## Support

If issues persist:
1. Check `/ASSET_DISPLAY_IMPLEMENTATION.md` for detailed technical info
2. Check `/FIXES_APPLIED.md` for previous fixes
3. Review Supabase Dashboard → Logs for backend errors
4. Check browser console for frontend errors
5. Verify RLS policies in Supabase Dashboard → SQL Editor

**Key Files to Review:**
- `/utils/api.ts` - API layer
- `/utils/supabase/db.ts` - Database helpers
- `/components/admin/AdminClientDetail.tsx` - Admin view
- `/components/AssetsLibrary.tsx` - Client view
- `/components/RequestHistory.tsx` - Request history
