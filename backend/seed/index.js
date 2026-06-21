require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User    = require('../models/User');
const Student = require('../models/Student');
const Room    = require('../models/Room');
const Notice  = require('../models/Notice');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormease');
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Room.deleteMany({}),
    Notice.deleteMany({}),
    require('../models/Complaint').deleteMany({}),
    require('../models/Leave').deleteMany({}),
    require('../models/Payment').deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('Password@123', 12);

  // ── Only admin is seeded — everyone else must register and be approved ──
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@dormease.com',
    password: hashedPassword,
    role: 'admin',
    phone: '+91 99999 00001',
    isActive: true,
    approvalStatus: 'approved',
  });

  // ── Seed some rooms so admin has something to work with ──
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

  // ── Seed a welcome notice ──
  await Notice.create({
    title: 'Welcome to DormEase',
    body: 'DormEase is now live. Students and wardens can register and await admin approval before accessing the portal.',
    tag: 'general',
    postedBy: admin._id,
    isPinned: true,
  });

  console.log('\n✅ Seed complete!\n');
  console.log('🔐 Admin Login:');
  console.log('   Email:    admin@dormease.com');
  console.log('   Password: Password@123\n');
  console.log('ℹ️  All other users must register via the portal and be approved by admin.\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});