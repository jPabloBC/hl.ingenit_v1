# Database Setup Guide for ShIngenit

## Problem Resolution

The registration was failing with a 500 error because the application was trying to use non-existent Edge Functions and database triggers. This guide will help you set up the database properly.

## Steps to Fix Registration Issues

### 1. Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-setup.sql` into the editor
4. Run the script

### 2. Verify Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Test Registration

After setting up the database:

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/register`
3. Try registering a new user
4. The registration should now work without the 500 error

## What Was Fixed

### Before (Causing 500 Error):
- The code was trying to call a non-existent Edge Function `create-business`
- It was expecting a database trigger `handle_new_user` that didn't exist
- Inconsistent table names (`users`, `hl_user`, `app_rh.hl_user`)

### After (Working Solution):
- Direct database operations using Supabase client
- Consistent table naming with `ws_` prefix
- Proper error handling and user feedback
- Simplified registration flow

## Database Tables Created

### `ws_users`
- Stores user information
- Links to Supabase Auth users
- Includes email verification status

### `ws_businesses`
- Stores business information
- Links to users via `user_id`
- Supports both hotel and restaurant types

## Security Features

- Row Level Security (RLS) enabled
- Users can only access their own data
- Proper foreign key constraints
- Automatic timestamp updates

## Troubleshooting

If you still encounter issues:

1. **Check Supabase Logs**: Go to your Supabase dashboard > Logs to see any database errors
2. **Verify RLS Policies**: Make sure the Row Level Security policies are properly set up
3. **Check Network Tab**: Open browser dev tools and check the Network tab for failed requests
4. **Console Errors**: Check the browser console for JavaScript errors

## Next Steps

After successful registration:

1. Implement email verification system
2. Add password reset functionality
3. Create user dashboard
4. Add business management features

## Support

If you continue to have issues, please check:
- Supabase project status
- Environment variables configuration
- Database permissions
- Network connectivity
