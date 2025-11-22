# Magic Link Testing Guide

## How Magic Link Works

When a user requests a magic link:
1. They enter their email on the login page
2. Supabase sends them an email with a unique link
3. They click the link in their email
4. The link redirects back to your app with auth tokens in the URL hash
5. The app detects the tokens and creates a session
6. The user is logged in automatically

## Testing Magic Link Login

### Step 1: Create Test User in Supabase Auth

You have two options:

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/jqdmpwuzthojykzyhevh
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite user"**
4. Enter email address (e.g., `test@example.com`)
5. Leave password blank (for magic link only users)
6. Click **"Send Magic Link"** or just save

**Option B: Let them sign up via Magic Link**
1. User goes to login page
2. Clicks "Use magic link instead"
3. Enters their email
4. Magic link will be sent (first-time users are auto-created)

### Step 2: Send Magic Link

1. Go to your app's login page
2. Click **"Use magic link instead"**
3. Enter the email address (e.g., `camille@jointhequest.co`)
4. Click **"Send Magic Link"**
5. You should see: "Check your email" screen

### Step 3: Check Email

The user will receive an email from Supabase with subject:
> "Magic Link to sign in"

Or similar, depending on your email template.

**Important**: Check spam folder if you don't see it!

### Step 4: Click the Link

The email will contain a link like:
```
https://jqdmpwuzthojykzyhevh.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=http://localhost:3000
```

When clicked, it redirects to:
```
http://localhost:3000/#access_token=eyJ...&expires_at=...&refresh_token=...&token_type=bearer&type=magiclink
```

### Step 5: Automatic Login

The app will:
1. ✅ Detect the `access_token` in the URL hash
2. ✅ Call `supabase.auth.setSession()` with the tokens
3. ✅ Call `initUserProfile()` to upsert the user record
4. ✅ Clean up the URL hash
5. ✅ Show the dashboard

**Console logs to look for:**
```
🔵 Magic link callback detected, setting session...
✅ Session set successfully from magic link
🔵 Initializing user profile for: camille@jointhequest.co
🔵 Upserting user profile: { email: '...', clientId: '...' }
✅ User profile initialized: { email: '...', isNewUser: true }
```

## Troubleshooting

### Issue: Magic link email not received

**Causes:**
- Email provider blocking Supabase emails
- Email in spam folder
- Supabase email service not configured

**Fix:**
1. Check spam/junk folder
2. Go to Supabase Dashboard → Authentication → Email Templates
3. Configure SMTP settings (optional, for production)
4. For testing, you can view the magic link in Supabase logs:
   - Go to **Project Settings** → **API**
   - Enable "Disable email confirmation" (testing only!)

### Issue: Magic link redirects but login doesn't work

**Causes:**
- Redirect URL not matching
- URL hash not being parsed correctly

**Fix:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Make sure **Site URL** is set to: `http://localhost:3000` (for dev) or your production URL
3. Add redirect URL to **Redirect URLs** list
4. Check browser console for errors

### Issue: "Session expired" or "Invalid token"

**Causes:**
- Magic link was already used
- Magic link expired (default: 1 hour)
- Token was tampered with

**Fix:**
- Request a new magic link
- Magic links are single-use only!

### Issue: User created but no client record

**Causes:**
- `initUserProfile()` failed to create client
- Network error during profile initialization

**Fix:**
1. Check browser console for errors
2. Go to admin panel (#admin)
3. Look at database debug view
4. If user exists but client doesn't, go to admin dashboard
5. Click "Sync Clients" button (this will create missing client records)

## Email Configuration (Production)

For production, you should configure a custom SMTP server:

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **"Settings"**
3. Configure your SMTP server:
   - Host: `smtp.your-email-provider.com`
   - Port: `587` (or `465` for SSL)
   - Username: Your email
   - Password: Your email password
4. Customize email templates with your branding

**Recommended Email Providers:**
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 5,000 emails/month)
- AWS SES (very cheap)
- Resend (modern, developer-friendly)

## Testing Checklist

- [ ] User can request magic link
- [ ] Email arrives within 1 minute
- [ ] Magic link redirects to app with tokens
- [ ] App detects tokens and sets session
- [ ] User profile is created/updated in database
- [ ] Client record is created if new user
- [ ] User is redirected to dashboard
- [ ] URL hash is cleaned up (no tokens visible)
- [ ] User can navigate app normally
- [ ] User remains logged in on page refresh

## Database Check

After a successful magic link login, check the database:

**User Record** (key: `user:{supabaseAuthId}`):
```json
{
  "id": "b4abfacf-a324-4ee1-aa7b-471ff6fb0347",
  "email": "camille@jointhequest.co",
  "name": "camille",
  "company": "Company",
  "clientId": "abc-123-def",
  "status": "active",
  "createdAt": "2025-01-21T10:30:00.000Z",
  "lastLoginAt": "2025-01-21T10:30:00.000Z"
}
```

**Client Record** (key: `client:{clientId}`):
```json
{
  "id": "abc-123-def",
  "name": "camille",
  "email": "camille@jointhequest.co",
  "createdAt": "2025-01-21T10:30:00.000Z",
  "lastActivity": "2025-01-21T10:30:00.000Z",
  "activeRequests": 0,
  "status": "active"
}
```

**Second Login:**
- Same user record (only `lastLoginAt` updated)
- NO duplicate rows
- Client record's `lastActivity` updated

## Comparison: Magic Link vs Password

| Feature | Magic Link | Password |
|---------|-----------|----------|
| Security | ✅ Very secure (no password to steal) | ⚠️ Depends on password strength |
| User Experience | ✅ No password to remember | ⚠️ Password can be forgotten |
| Setup | ✅ Auto-creates user | ❌ Must be pre-created |
| Speed | ⚠️ Requires email check | ✅ Instant login |
| Email Required | ✅ Yes (always) | ⚠️ Only for reset |
| Best For | End users, clients | Admin, frequent users |

## Next Steps

Once magic link is working:
1. ✅ Test with multiple email addresses
2. ✅ Test second login (should update, not duplicate)
3. ✅ Configure custom email templates
4. ✅ Set up custom SMTP for production
5. ⬜ Add social OAuth (Google, GitHub) - optional

---

**Current Status**: Magic link integration complete and ready for testing!
