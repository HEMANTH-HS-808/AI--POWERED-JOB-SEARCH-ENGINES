/**
 * Script to create an admin user
 * Usage: node server/scripts/createAdmin.js <email> <username> <password>
 * Or set environment variables: ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    // Get admin details from command line args or environment variables
    const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@skillsync.com';
    const username = process.argv[3] || process.env.ADMIN_USERNAME || 'admin';
    const password = process.argv[4] || process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('Admin user already exists:');
        console.log(`  Email: ${existingUser.email}`);
        console.log(`  Username: ${existingUser.username}`);
        console.log(`  Role: ${existingUser.role}`);
        process.exit(0);
      } else {
        // Update existing user to admin
        existingUser.role = 'admin';
        existingUser.passwordHash = password; // Will be hashed by pre-save middleware
        await existingUser.save();
        console.log('Existing user updated to admin:');
        console.log(`  Email: ${existingUser.email}`);
        console.log(`  Username: ${existingUser.username}`);
        console.log(`  Role: ${existingUser.role}`);
        process.exit(0);
      }
    }

    // Create new admin user
    const admin = new User({
      email,
      username,
      passwordHash: password, // Will be hashed by pre-save middleware
      role: 'admin',
      university: 'Admin University',
      skills: ['Administration', 'Management'],
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        bio: 'System Administrator'
      }
    });

    await admin.save();

    console.log('Admin user created successfully:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Password: ${password}`);
    console.log('\nYou can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

