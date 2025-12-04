# Admin Setup Guide

This guide explains how to set up and use the admin panel for the Job Search Engine.

## Admin Access

There are three ways to grant admin access:

1. **Email-based admin**: Users with email `admin@skillsync.com` automatically have admin access
2. **Role-based admin**: Users with `role: 'admin'` in the database have admin access
3. **Environment variable**: Set `ADMIN_EMAIL` in `.env` to grant admin access to a specific email

## Creating an Admin User

### Option 1: Using the Script (Recommended)

Run the provided script to create an admin user:

```bash
cd server
node scripts/createAdmin.js <email> <username> <password>
```

Example:
```bash
node scripts/createAdmin.js admin@skillsync.com admin admin123
```

Or set environment variables:
```bash
ADMIN_EMAIL=admin@skillsync.com ADMIN_USERNAME=admin ADMIN_PASSWORD=admin123 node scripts/createAdmin.js
```

### Option 2: Manual Database Update

1. Create a regular user account through the registration page
2. Update the user's role in MongoDB:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Option 3: Demo Mode

In demo mode, a default admin user is automatically created:
- **Email**: `admin@skillsync.com`
- **Password**: `admin123`
- **Username**: `admin`

## Admin Features

Once logged in as an admin, you'll see an "Admin" link in the navigation bar. The admin panel includes:

### Dashboard Tab
- Overview statistics (total users, companies, saved companies, active sessions)
- Recent user registrations
- Quick access to key metrics

### Users Tab
- View all registered users with pagination
- Search users by username or email
- Update user roles (promote to admin or demote to user)
- Delete users (with confirmation)
- View user details (skills, saved companies, etc.)

### Statistics Tab
- Detailed user statistics (total, with skills, with saved companies)
- User role distribution (regular users vs admins)
- Company cache statistics
- Activity metrics

## Admin API Endpoints

All admin endpoints require authentication and admin privileges:

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (with pagination and search)
- `GET /api/admin/users/:userId` - Get specific user details
- `PUT /api/admin/users/:userId` - Update user (role, skills, etc.)
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/companies` - Get all cached companies
- `GET /api/admin/stats` - Get detailed statistics

## Security Notes

1. **Admin middleware** checks both role and email for admin access
2. Admins cannot delete their own account
3. All admin routes are protected with authentication and authorization middleware
4. Admin access is checked on both frontend and backend

## Troubleshooting

### Can't access admin panel
- Verify you're logged in
- Check that your user has `role: 'admin'` or email matches `admin@skillsync.com`
- Check browser console for any error messages
- Verify the admin route is accessible: `/admin`

### Admin user not working
- Ensure the user exists in the database
- Check the user's role field: `db.users.findOne({ email: "your-email" })`
- Try logging out and logging back in to refresh the session
- Clear browser localStorage and cookies

### Script errors
- Ensure MongoDB is running
- Check that `MONGODB_URI` is set correctly in `.env`
- Verify Node.js and required packages are installed

## Demo Mode

In demo mode (`NODE_ENV=demo`), admin functionality is limited:
- User updates and deletions are not supported
- Company cache is not available
- All other features work normally

