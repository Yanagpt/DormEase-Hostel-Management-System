require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User    = require('../models/User');
const Student = require('../models/Student');
const Room    = require('../models/Room');
const Notice  = require('../models/Notice');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormease');
  console.log('✅ Connected to MongoDB');
};

// Prompt helper
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

const seed = async () => {
  await connectDB();

  console.log('\n🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Room.deleteMany({}),
    Notice.deleteMany({}),
    require('../models/Complaint').deleteMany({}),
    require('../models/Leave').deleteMany({}),
    require('../models/Payment').deleteMany({}),
  ]);

  // ── Prompt for admin credentials (no hardcoded password) ──
  console.log('\n🔐 Set up the Admin account (you will use these to log in):\n');
  const adminName  = await prompt('   Admin name  : ');
  const adminEmail = await prompt('   Admin email : ');

  let adminPassword;
  while (true) {
    adminPassword = await prompt('   Password    : ');
    if (adminPassword.length >= 6) break;
    console.log('   ⚠️  Password must be at least 6 characters. Try again.');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await User.create({
    name: adminName || 'Super Admin',
    email: adminEmail.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    approvalStatus: 'approved',
    passwordSet: true,
  });

  // ── Seed rooms ──
  await Room.insertMany([
    { roomNumber: '101', floor: 1, block: 'A', type: 'triple',  capacity: 3, monthlyRent: 8000,  amenities: ['wifi', 'wardrobe', 'study-table'] },
    { roomNumber: '102', floor: 1, block: 'A', type: 'double',  capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac', 'wardrobe'] },
    { roomNumber: '103', floor: 1, block: 'A', type: 'triple',  capacity: 3, monthlyRent: 8000,  amenities: ['wifi'], status: 'maintenance' },
    { roomNumber: '201', floor: 2, block: 'A', type: 'double',  capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac', 'attached-bathroom'] },
    { roomNumber: '202', floor: 2, block: 'A', type: 'triple',  capacity: 3, monthlyRent: 8000,  amenities: ['wifi', 'wardrobe'] },
    { roomNumber: '301', floor: 3, block: 'A', type: 'quad',    capacity: 4, monthlyRent: 7000,  amenities: ['wifi', 'wardrobe', 'study-table'] },
    { roomNumber: '302', floor: 3, block: 'A', type: 'single',  capacity: 1, monthlyRent: 15000, amenities: ['wifi', 'ac', 'attached-bathroom', 'fridge', 'tv'] },
    { roomNumber: '401', floor: 4, block: 'B', type: 'double',  capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac'] },
    { roomNumber: '402', floor: 4, block: 'B', type: 'triple',  capacity: 3, monthlyRent: 8000,  amenities: ['wifi'] },
    { roomNumber: '403', floor: 4, block: 'B', type: 'double',  capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'wardrobe'] },
  ]);

  await Notice.create({
    title: 'Welcome to DormEase',
    body: 'DormEase is now live. Students and wardens can register and await admin approval.',
    tag: 'general',
    postedBy: admin._id,
    isPinned: true,
  });

  console.log('\n✅ Seed complete!\n');
  console.log(`🔐 Admin login: ${adminEmail}`);
  console.log('ℹ️  All other users must register via the portal and be approved by admin.\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
