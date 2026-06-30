require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User    = require('../models/User');
const Student = require('../models/Student');
const Room    = require('../models/Room');
const Notice  = require('../models/Notice');
const Hostel  = require('../models/Hostel');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormease');
  console.log('✅ Connected to MongoDB');
};

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
    Hostel.deleteMany({}),
    require('../models/Complaint').deleteMany({}),
    require('../models/Leave').deleteMany({}),
    require('../models/Payment').deleteMany({}),
    require('../models/Attendance').deleteMany({}),
  ]);

  // ── Super Admin ──────────────────────────────────────────────────────────
  console.log('\n🔐 Set up the Super Admin account:\n');
  const saName  = await prompt('   Super Admin name  : ');
  const saEmail = await prompt('   Super Admin email : ');
  let saPassword;
  while (true) {
    saPassword = await prompt('   Password          : ');
    if (saPassword.length >= 6) break;
    console.log('   ⚠️  Min 6 characters.');
  }

  const saHash = await bcrypt.hash(saPassword, 12);
  await User.create({
    name: saName || 'Super Admin',
    email: saEmail.toLowerCase(),
    password: saHash,
    role: 'superadmin',
    isActive: true,
    approvalStatus: 'approved',
    passwordSet: true,
    hostel: null,
  });
  console.log(`\n✅ Super Admin created: ${saEmail}`);

  // ── Demo hostel (optional) ────────────────────────────────────────────────
  const createDemo = await prompt('\n📦 Create a demo hostel with admin? (y/n): ');
  if (createDemo.toLowerCase() === 'y') {
    const hostel = await Hostel.create({
      name: 'DormEase Demo Hostel',
      code: 'DEMO01',
      type: 'co-ed',
      status: 'active',
      address: { city: 'Demo City', state: 'Demo State' },
    });

    const adminEmail = await prompt('   Demo Admin email : ');
    const adminPass  = await prompt('   Demo Admin password : ');
    const adminHash  = await bcrypt.hash(adminPass, 12);

    const admin = await User.create({
      name: 'Demo Admin',
      email: adminEmail.toLowerCase(),
      password: adminHash,
      role: 'admin',
      hostel: hostel._id,
      isActive: true,
      approvalStatus: 'approved',
      passwordSet: true,
    });

    await Hostel.findByIdAndUpdate(hostel._id, { admin: admin._id });

    // Seed demo rooms
    const rooms = [];
    for (const r of [
      { roomNumber: '101', floor: 1, block: 'A', type: 'double', capacity: 2, monthlyRent: 8000 },
      { roomNumber: '102', floor: 1, block: 'A', type: 'triple', capacity: 3, monthlyRent: 7000 },
      { roomNumber: '201', floor: 2, block: 'A', type: 'single', capacity: 1, monthlyRent: 12000 },
      { roomNumber: '202', floor: 2, block: 'B', type: 'double', capacity: 2, monthlyRent: 8000 },
    ]) {
      rooms.push({ ...r, hostel: hostel._id, amenities: ['wifi', 'wardrobe'] });
    }
    await Room.insertMany(rooms);

    await Notice.create({
      title: 'Welcome to DormEase Demo Hostel',
      body: 'This is the demo hostel. Students and wardens can register and await admin approval.',
      tag: 'general',
      postedBy: admin._id,
      hostel: hostel._id,
      isPinned: true,
    });

    console.log(`\n✅ Demo hostel created: DormEase Demo Hostel (code: DEMO01)`);
    console.log(`✅ Demo admin: ${adminEmail}`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log(`🔑 Super Admin: ${saEmail}`);
  console.log('ℹ️  Log in as Super Admin to create and manage hostels.\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
