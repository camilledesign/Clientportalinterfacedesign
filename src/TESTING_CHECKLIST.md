# Testing Checklist - Magic Link & Upsert Implementation

## 🎯 Goal
Verify that users are stored correctly with NO duplicate rows on login.

## 📋 Pre-Test Setup

### 1. Clear your database (optional - fresh start)
- [ ] Go to `http://localhost:3000/#cleanup`
- [ ] Click "Clear All" to reset database
- [ ] Click "Seed Database" to create test data

### 2. Check Supabase Configuration
- [ ] Go to https://supabase.com/dashboard/project/jqdmpwuzthojykzyhevh
- [ ] Navigate to **Authentication** → **URL Configuration**
- [ ] Verify **Site URL** is set to: `http://localhost:3000`
- [ ] Add `http://localhost:3000` to **Redirect URLs** if not present

## 🧪 Test Case 1: Magic Link Login (NEW USER)

### Steps:
1. [ ] Go to `http://localhost:3000`
2. [ ] You should see the login screen
3. [ ] Click **"Use magic link instead"**
4. [ ] Enter email: `test@example.com` (or your email)
5. [ ] Click **"Send Magic Link"**
6. [ ] You should see: "Check your email" screen

### Expected Email:
- [ ] Check your inbox (and spam folder!)
- [ ] Email subject: "Magic Link to sign in" (or similar)
- [ ] Email contains a link starting with: `https://jqdmpwuzthojykzyhevh.supabase.co/auth/v1/verify?token=...`

### Click the Magic Link:
7. [ ] Click the link in the email
8. [ ] Browser should redirect to: `http://localhost:3000/#access_token=...`
9. [ ] App should show "Loading..." briefly
10. [ ] You should be logged in and see the dashboard

### Verify in Console:
```
🔵 Magic link callback detected, setting session...
✅ Session set successfully from magic link
🔵 Initializing user profile for: test@example.com
🆕 Generated new clientId: abc-123-...
🔵 Upserting user profile: { email: 'test@example.com', clientId: '...' }
✅ User profile initialized: { email: 'test@example.com', isNewUser: true }
```

### Verify in Database:
11. [ ] Go to `http://localhost:3000/#admin` (code: `3333`)
12. [ ] Click "Clients" tab
13. [ ] You should see 1 new client with email `test@example.com`
14. [ ] Click "Database Debug" to see raw data
15. [ ] Look for key: `user:{supabase-uuid}` (NOT `user:email`)
16. [ ] Verify `clientId` matches the client record

**✅ Expected Result**: 1 user row + 1 client row created

## 🧪 Test Case 2: Magic Link Login (EXISTING USER - NO DUPLICATES!)

### Steps:
1. [ ] Click the logout button in top-right
2. [ ] You should be back at login screen
3. [ ] Click **"Use magic link instead"**
4. [ ] Enter the SAME email: `test@example.com`
5. [ ] Click **"Send Magic Link"**
6. [ ] Check email and click the new magic link

### Verify in Console:
```
🔵 Magic link callback detected, setting session...
✅ Session set successfully from magic link
🔵 Initializing user profile for: test@example.com
✅ Found existing clientId: abc-123-...
🔵 Upserting user profile: { email: 'test@example.com', clientId: '...' }
✅ User profile initialized: { email: 'test@example.com', isNewUser: false }
```

### Verify in Database:
7. [ ] Go to `http://localhost:3000/#admin`
8. [ ] Click "Database Debug"
9. [ ] Look for key: `user:{supabase-uuid}`
10. [ ] **CRITICAL**: Should still see ONLY 1 user row (not 2!)
11. [ ] Check `lastLoginAt` - should be updated to current time
12. [ ] Verify `createdAt` is still the original time

**✅ Expected Result**: SAME user row (only `lastLoginAt` updated), NO duplicate!

## 🧪 Test Case 3: Password Login (BACKWARD COMPATIBILITY)

### Steps:
1. [ ] Logout
2. [ ] On login screen, DON'T click magic link toggle
3. [ ] Enter email: `camille@jointhequest.co`
4. [ ] Enter password: `1234`
5. [ ] Click **"Sign In"**

### Expected:
6. [ ] Should login successfully (no Supabase Auth, uses legacy)
7. [ ] Dashboard should load
8. [ ] Console should show legacy signin flow

**✅ Expected Result**: Legacy password auth still works

## 🧪 Test Case 4: Third Login (STILL NO DUPLICATES!)

### Steps:
1. [ ] Logout
2. [ ] Login AGAIN with magic link using `test@example.com`
3. [ ] Click magic link in email

### Verify:
4. [ ] Go to Database Debug
5. [ ] **CRITICAL**: Should STILL see only 1 user row
6. [ ] `lastLoginAt` should be updated again
7. [ ] No new rows created

**✅ Expected Result**: STILL 1 user row, no duplicates!

## 🧪 Test Case 5: Auth Debug Page

### Steps:
1. [ ] While logged in, go to: `http://localhost:3000/#auth-debug`
2. [ ] You should see auth debug info

### Verify:
- [ ] **Session** section shows green box with access token
- [ ] **User** section shows green box with user ID and email
- [ ] **localStorage** shows `user_data` and `sb_access_token`
- [ ] User ID should be a UUID (not an email!)

**✅ Expected Result**: Auth debug shows valid session

## 📊 Database Verification

### Go to Admin Panel → Database Debug

Count the rows:

**Users** (key: `user:*`):
- [ ] Should match number of unique users logged in
- [ ] Keys should be `user:{uuid}` NOT `user:email`
- [ ] Each user should have `lastLoginAt` field

**Clients** (key: `client:*`):
- [ ] Should match number of users (1 client per user)
- [ ] Each client should have matching email to user

**Requests** (key: `request:*`):
- [ ] Should show any requests created by users

## 🔍 Common Issues & Solutions

### Issue: "No email received"
**Solution**: 
- Check spam folder
- Wait up to 2 minutes (Supabase email can be slow)
- Verify email address is correct
- Check Supabase logs in dashboard

### Issue: Magic link redirects but doesn't log in
**Solution**:
- Check browser console for errors
- Verify Site URL in Supabase dashboard
- Try clearing localStorage: `http://localhost:3000/#auth-debug` → "Clear localStorage"

### Issue: User row duplicated on login
**Solution**:
- Check if using correct `signInWithMagicLink()` from `/utils/auth.ts`
- Verify `initUserProfile()` is being called
- Check console logs for "Upserting user profile"
- User ID should be UUID, not email

### Issue: Client not created
**Solution**:
- Go to Admin Panel (#admin)
- Click "Sync Clients" button
- This will create any missing client records

## ✅ Success Criteria

- [x] Magic link email received
- [x] Magic link redirects to app with tokens
- [x] App automatically logs user in
- [x] User profile created/updated in database
- [x] Client record created if new user
- [x] **NO duplicate user rows** (multiple logins = same row)
- [x] `lastLoginAt` updates on each login
- [x] `createdAt` stays the same
- [x] Auth debug page shows valid session
- [x] Logout works correctly
- [x] Legacy password login still works

## 📝 Final Check

After completing all tests:

1. [ ] Login with magic link 3 times with same email
2. [ ] Go to Database Debug
3. [ ] Count user rows with that email
4. [ ] **Should be EXACTLY 1 row** (not 3!)

**If you see only 1 row** ✅ **SUCCESS!** The upsert logic is working correctly!

**If you see multiple rows** ❌ **ISSUE!** Check console logs and verify you're using the new auth functions.

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. ✅ Celebrate - no more duplicate rows! 🎊
2. 📧 Configure custom email templates in Supabase
3. 🔐 (Optional) Enable social OAuth (Google, GitHub)
4. 🚀 Deploy to production with proper Site URL

---

**Testing Date**: _____________
**Tester**: _____________
**Results**: PASS / FAIL
**Notes**: _____________________________________________
