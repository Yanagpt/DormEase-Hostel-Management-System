/**
 * Bulletproof admin fix — directly updates MongoDB without going through Mongoose middleware
 * Run: node fix-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fix() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dormease';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', uri);

  const ADMIN_EMAIL    = 'admin@dormease.com';
  const ADMIN_PASSWORD = 'Password@123';

  // Hash the password directly
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  console.log('✅ Password hashed');

  // Use native MongoDB driver directly — bypasses ALL Mongoose middleware
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const existing = await users.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    // Direct MongoDB update — no hooks, no validation, no issues
    const result = await users.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: {
          password:       hash,
          role:           'admin',
          isActive:       true,
          approvalStatus: 'approved',
          name:           'Super Admin',
        }
      }
    );
    console.log('✅ Admin updated. Modified count:', result.modifiedCount);
  } else {
    // Insert fresh admin
    await users.insertOne({
      name:           'Super Admin',
      email:          ADMIN_EMAIL,
      password:       hash,
      role:           'admin',
      isActive:       true,
      approvalStatus: 'approved',
      createdAt:      new Date(),
      updatedAt:      new Date(),
    });
    console.log('✅ Admin created fresh.');
  }

  // Verify it worked
  const check = await users.findOne({ email: ADMIN_EMAIL });
  const verify = await bcrypt.compare(ADMIN_PASSWORD, check.password);
  console.log('✅ Password verification:', verify ? 'PASS ✓' : 'FAIL ✗');
  console.log('✅ isActive:', check.isActive);
  console.log('✅ approvalStatus:', check.approvalStatus);
  console.log('✅ role:', check.role);

  console.log('\n🔐 Login with:');
  console.log('   Email:    ' + ADMIN_EMAIL);
  console.log('   Password: ' + ADMIN_PASSWORD);

  await mongoose.connection.close();
  process.exit(0);
}

fix().catch(function(err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
});