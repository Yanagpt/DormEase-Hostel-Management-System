require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Leave = require('../models/Leave');
const Notice = require('../models/Notice');
const Payment = require('../models/Payment');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormease');
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Room.deleteMany({}),
    Complaint.deleteMany({}), Leave.deleteMany({}),
    Notice.deleteMany({}), Payment.deleteMany({}),
  ]);

  // ─── USERS ───────────────────────────────────
  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('Password@123', 12);

  const [admin, warden1, warden2, ...studentUsers] = await User.insertMany([
    { name: 'Super Admin', email: 'admin@dormease.com', password: hashedPassword, role: 'admin', phone: '+91 99999 00001', isActive: true },
    { name: 'Dr. Rajesh Kumar', email: 'warden@dormease.com', password: hashedPassword, role: 'warden', phone: '+91 99999 00002', isActive: true },
    { name: 'Ms. Priya Nair', email: 'warden2@dormease.com', password: hashedPassword, role: 'warden', phone: '+91 99999 00003', isActive: true },
    { name: 'Rahul Sharma', email: 'rahul@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43210', isActive: true },
    { name: 'Priya Mehta', email: 'priya@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43211', isActive: true },
    { name: 'Amit Kumar', email: 'amit@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43212', isActive: true },
    { name: 'Sneha Patel', email: 'sneha@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43213', isActive: true },
    { name: 'Vikram Reddy', email: 'vikram@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43214', isActive: true },
    { name: 'Neha Gupta', email: 'neha@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43215', isActive: true },
    { name: 'Dev Anand', email: 'dev@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43216', isActive: true },
    { name: 'Suresh Kumar', email: 'suresh@student.com', password: hashedPassword, role: 'student', phone: '+91 98765 43217', isActive: true },
  ]);

  // ─── ROOMS ───────────────────────────────────
  console.log('🏠 Seeding rooms...');
  const rooms = await Room.insertMany([
    { roomNumber: '101', floor: 1, block: 'A', type: 'triple', capacity: 3, monthlyRent: 8000, amenities: ['wifi', 'wardrobe', 'study-table'], warden: warden1._id },
    { roomNumber: '102', floor: 1, block: 'A', type: 'double', capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac', 'wardrobe'], warden: warden1._id },
    { roomNumber: '103', floor: 1, block: 'A', type: 'triple', capacity: 3, monthlyRent: 8000, status: 'maintenance', amenities: ['wifi'], warden: warden1._id },
    { roomNumber: '201', floor: 2, block: 'A', type: 'double', capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac', 'attached-bathroom'], warden: warden1._id },
    { roomNumber: '202', floor: 2, block: 'A', type: 'triple', capacity: 3, monthlyRent: 8000, amenities: ['wifi', 'wardrobe'], warden: warden1._id },
    { roomNumber: '301', floor: 3, block: 'A', type: 'quad', capacity: 4, monthlyRent: 7000, amenities: ['wifi', 'wardrobe', 'study-table'], warden: warden2._id },
    { roomNumber: '302', floor: 3, block: 'A', type: 'single', capacity: 1, monthlyRent: 15000, amenities: ['wifi', 'ac', 'attached-bathroom', 'fridge', 'tv'], warden: warden2._id },
    { roomNumber: '401', floor: 4, block: 'B', type: 'double', capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'ac'], warden: warden2._id },
    { roomNumber: '402', floor: 4, block: 'B', type: 'triple', capacity: 3, monthlyRent: 8000, amenities: ['wifi'], warden: warden2._id },
    { roomNumber: '403', floor: 4, block: 'B', type: 'double', capacity: 2, monthlyRent: 10000, amenities: ['wifi', 'wardrobe'], warden: warden2._id },
  ]);

  // ─── STUDENT PROFILES ────────────────────────
  console.log('🎓 Seeding student profiles...');
  const studentData = [
    { user: studentUsers[0]._id, rollNumber: 'CS2021001', course: 'B.Tech Computer Science', year: 3, department: 'CSE', gender: 'male', dateOfBirth: new Date('2003-03-15'), parentName: 'Suresh Sharma', parentPhone: '+91 98765 12345', room: rooms[5]._id, feeStatus: 'paid', attendance: 95 },
    { user: studentUsers[1]._id, rollNumber: 'CS2021002', course: 'B.Tech Computer Science', year: 3, department: 'CSE', gender: 'female', dateOfBirth: new Date('2003-06-20'), parentName: 'Anil Mehta', parentPhone: '+91 98765 12346', room: rooms[1]._id, feeStatus: 'paid', attendance: 88 },
    { user: studentUsers[2]._id, rollNumber: 'EE2021003', course: 'B.Tech Electrical Engineering', year: 3, department: 'EEE', gender: 'male', dateOfBirth: new Date('2002-11-05'), parentName: 'Ramesh Kumar', parentPhone: '+91 98765 12347', room: rooms[0]._id, feeStatus: 'overdue', attendance: 72 },
    { user: studentUsers[3]._id, rollNumber: 'ME2022004', course: 'B.Tech Mechanical Engineering', year: 2, department: 'MECH', gender: 'female', dateOfBirth: new Date('2004-01-12'), parentName: 'Sunil Patel', parentPhone: '+91 98765 12348', room: rooms[4]._id, feeStatus: 'pending', attendance: 91 },
    { user: studentUsers[4]._id, rollNumber: 'CS2021005', course: 'B.Tech Computer Science', year: 3, department: 'CSE', gender: 'male', dateOfBirth: new Date('2002-08-22'), parentName: 'Krishna Reddy', parentPhone: '+91 98765 12349', room: rooms[0]._id, feeStatus: 'paid', attendance: 85 },
    { user: studentUsers[5]._id, rollNumber: 'CE2022006', course: 'B.Tech Civil Engineering', year: 2, department: 'CIVIL', gender: 'female', dateOfBirth: new Date('2004-04-30'), parentName: 'Manoj Gupta', parentPhone: '+91 98765 12350', room: rooms[4]._id, feeStatus: 'pending', attendance: 78 },
    { user: studentUsers[6]._id, rollNumber: 'CS2023007', course: 'B.Tech Computer Science', year: 1, department: 'CSE', gender: 'male', dateOfBirth: new Date('2005-07-18'), parentName: 'Ashok Anand', parentPhone: '+91 98765 12351', room: rooms[5]._id, feeStatus: 'paid', attendance: 93 },
    { user: studentUsers[7]._id, rollNumber: 'IT2022008', course: 'B.Tech Information Technology', year: 2, department: 'IT', gender: 'male', dateOfBirth: new Date('2003-12-25'), parentName: 'Ganesh Kumar', parentPhone: '+91 98765 12352', room: rooms[5]._id, feeStatus: 'paid', attendance: 89 },
  ];

  const students = await Student.insertMany(studentData);

  // Update room occupants
  await Room.findByIdAndUpdate(rooms[5]._id, { occupants: [students[0]._id, students[6]._id, students[7]._id] });
  await Room.findByIdAndUpdate(rooms[1]._id, { occupants: [students[1]._id] });
  await Room.findByIdAndUpdate(rooms[0]._id, { occupants: [students[2]._id, students[4]._id] });
  await Room.findByIdAndUpdate(rooms[4]._id, { occupants: [students[3]._id, students[5]._id] });

  // ─── COMPLAINTS ──────────────────────────────
  console.log('📋 Seeding complaints...');
  await Complaint.insertMany([
    { complaintId: 'C0001', student: studentUsers[1]._id, room: rooms[1]._id, title: 'AC Not Working', description: 'The air conditioner in room 102 has stopped working. It makes a loud noise and does not cool.', category: 'electrical', priority: 'high', status: 'open', timeline: [{ status: 'open', note: 'Complaint submitted', updatedAt: new Date() }] },
    { complaintId: 'C0002', student: studentUsers[0]._id, room: rooms[5]._id, title: 'Water Leakage in Bathroom', description: 'There is a water leakage from the ceiling of the bathroom. Water is dripping constantly.', category: 'plumbing', priority: 'high', status: 'in-progress', assignedTo: warden1._id, timeline: [{ status: 'open', note: 'Submitted', updatedAt: new Date(Date.now() - 86400000) }, { status: 'in-progress', note: 'Plumber assigned', updatedAt: new Date() }] },
    { complaintId: 'C0003', student: studentUsers[2]._id, room: rooms[0]._id, title: 'Broken Window', description: 'The window glass is cracked and causes security concerns.', category: 'maintenance', priority: 'medium', status: 'resolved', resolvedAt: new Date(), resolutionNote: 'Window glass replaced.', timeline: [{ status: 'open', updatedAt: new Date(Date.now() - 604800000) }, { status: 'resolved', note: 'Fixed', updatedAt: new Date() }] },
    { complaintId: 'C0004', student: studentUsers[3]._id, room: rooms[4]._id, title: 'Wi-Fi Connectivity Issue', description: 'Wi-Fi signal is very weak in room 202. Cannot attend online classes properly.', category: 'network', priority: 'low', status: 'open', timeline: [{ status: 'open', note: 'Submitted', updatedAt: new Date() }] },
    { complaintId: 'C0005', student: studentUsers[4]._id, room: rooms[0]._id, title: 'Bed Frame Damaged', description: 'The bed frame is damaged and makes noise. Need replacement.', category: 'furniture', priority: 'medium', status: 'in-progress', assignedTo: warden2._id, timeline: [{ status: 'open', updatedAt: new Date(Date.now() - 172800000) }, { status: 'in-progress', note: 'Carpenter scheduled', updatedAt: new Date() }] },
  ]);

  // ─── LEAVE REQUESTS ──────────────────────────
  console.log('📅 Seeding leave requests...');
  await Leave.insertMany([
    { leaveId: 'L0001', student: studentUsers[2]._id, fromDate: new Date('2026-06-05'), toDate: new Date('2026-06-07'), reason: 'Family function at home', leaveType: 'home-visit', status: 'approved', approvedBy: warden1._id, approvalNote: 'Approved. Safe journey.', approvedAt: new Date(), totalDays: 3 },
    { leaveId: 'L0002', student: studentUsers[1]._id, fromDate: new Date('2026-06-10'), toDate: new Date('2026-06-12'), reason: 'Medical checkup at hospital', leaveType: 'medical', status: 'pending', totalDays: 3 },
    { leaveId: 'L0003', student: studentUsers[0]._id, fromDate: new Date('2026-06-15'), toDate: new Date('2026-06-18'), reason: 'Home visit during semester break', leaveType: 'home-visit', status: 'pending', totalDays: 4 },
    { leaveId: 'L0004', student: studentUsers[4]._id, fromDate: new Date('2026-05-25'), toDate: new Date('2026-05-28'), reason: 'Exam preparation at home', leaveType: 'academic', status: 'rejected', approvedBy: warden1._id, approvalNote: 'Exam period. Cannot approve.', approvedAt: new Date(), totalDays: 4 },
  ]);

  // ─── NOTICES ─────────────────────────────────
  console.log('📢 Seeding notices...');
  await Notice.insertMany([
    { title: 'Hostel Fee Payment Deadline', body: 'All students are reminded to pay their hostel fees before June 30, 2026. Late payments will attract a fine of ₹500 per week. Please visit the fee counter or use the online portal.', tag: 'important', postedBy: admin._id, isPinned: true, views: 48 },
    { title: 'Water Supply Interruption – Floor 2', body: 'Due to pipe maintenance work, water supply on Floor 2 will be interrupted on June 8, 2026 from 9 AM to 2 PM. Students are advised to store water in advance.', tag: 'maintenance', postedBy: warden1._id, views: 32 },
    { title: 'Annual Hostel Cultural Fest', body: 'The Annual Cultural Fest will be held on June 15, 2026 in the hostel common hall from 5 PM onwards. All students are encouraged to participate and showcase their talents. Register before June 10.', tag: 'event', postedBy: warden2._id, views: 65 },
    { title: 'New Mess Menu Effective June 10', body: 'A revised mess menu will come into effect from June 10, 2026. The new menu includes more nutritious and varied meal options based on student feedback. Printed copies available at reception.', tag: 'general', postedBy: admin._id, views: 41 },
    { title: 'Visitor Policy Update', body: 'Visitors are now allowed only between 10 AM and 6 PM on weekdays, and 9 AM to 7 PM on weekends. All visitors must register at the reception desk with a valid ID.', tag: 'general', postedBy: admin._id, views: 29 },
    { title: 'Emergency Contact Numbers', body: 'Please note the following emergency numbers: Warden Office: +91 99999 00002, Security: +91 99999 00010, Medical: +91 99999 00020. Save these numbers for quick access.', tag: 'important', postedBy: admin._id, isPinned: true, views: 85 },
  ]);

  // ─── PAYMENTS ────────────────────────────────
  console.log('💰 Seeding payments...');
  const currentYear = 2026;
  await Payment.insertMany([
    { receiptNumber: 'RCP-2026-00001', student: studentUsers[0]._id, amount: 8000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), paidDate: new Date('2026-06-01'), status: 'paid', paymentMethod: 'online', transactionId: 'TXN001', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00002', student: studentUsers[0]._id, amount: 8000, feeType: 'hostel-fee', month: 5, year: currentYear, dueDate: new Date('2026-05-31'), paidDate: new Date('2026-05-02'), status: 'paid', paymentMethod: 'online', transactionId: 'TXN002', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00003', student: studentUsers[1]._id, amount: 10000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), paidDate: new Date('2026-06-03'), status: 'paid', paymentMethod: 'upi', transactionId: 'TXN003', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00004', student: studentUsers[2]._id, amount: 8000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-05-31'), status: 'overdue', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00005', student: studentUsers[3]._id, amount: 8000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), status: 'pending', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00006', student: studentUsers[4]._id, amount: 8000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), paidDate: new Date('2026-06-02'), status: 'paid', paymentMethod: 'cash', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00007', student: studentUsers[5]._id, amount: 8000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), status: 'pending', recordedBy: admin._id },
    { receiptNumber: 'RCP-2026-00008', student: studentUsers[6]._id, amount: 7000, feeType: 'hostel-fee', month: 6, year: currentYear, dueDate: new Date('2026-06-30'), paidDate: new Date('2026-06-04'), status: 'paid', paymentMethod: 'online', transactionId: 'TXN008', recordedBy: admin._id },
  ]);

  console.log('\n✅ Seed data inserted successfully!\n');
  console.log('📧 Demo Credentials:');
  console.log('   Admin:   admin@dormease.com   / Password@123');
  console.log('   Warden:  warden@dormease.com  / Password@123');
  console.log('   Student: rahul@student.com    / Password@123\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
