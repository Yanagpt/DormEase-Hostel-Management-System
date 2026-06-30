const Room = require('../models/Room');
const Student = require('../models/Student');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { hostelScope } = require('../middleware/auth');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { status, floor, block, type, search } = req.query;

  const filter = hostelScope(req);
  if (status) filter.status = status;
  if (floor !== undefined) filter.floor = Number(floor);
  if (block) filter.block = block.toUpperCase();
  if (type) filter.type = type;
  if (search) filter.roomNumber = { $regex: search, $options: 'i' };

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .populate('occupants', 'rollNumber')
      .populate({ path: 'occupants', populate: { path: 'user', select: 'name email phone' } })
      .populate('warden', 'name email')
      .sort({ block: 1, floor: 1, roomNumber: 1 })
      .skip(skip)
      .limit(limit),
    Room.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(rooms, total, page, limit) });
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate({ path: 'occupants', populate: { path: 'user', select: 'name email phone' } })
    .populate('warden', 'name email');
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  res.json({ success: true, data: room });
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Admin
const createRoom = async (req, res) => {
  const room = await Room.create({ ...req.body, hostel: req.hostelId });
  res.status(201).json({ success: true, message: 'Room created successfully.', data: room });
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Admin, Warden
const updateRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  // Prevent direct occupant manipulation — use assign/remove routes
  const { occupants, ...updateData } = req.body;
  Object.assign(room, updateData);
  // save() triggers the pre-save hook which respects maintenance/reserved status
  await room.save();
  res.json({ success: true, message: 'Room updated.', data: room });
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Admin
const deleteRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (room.occupants.length > 0) {
    return res.status(400).json({ success: false, message: 'Cannot delete a room with occupants. Remove students first.' });
  }
  await room.deleteOne();
  res.json({ success: true, message: 'Room deleted.' });
};

// @desc    Assign student to room
// @route   POST /api/rooms/:id/assign
// @access  Admin, Warden
const assignStudent = async (req, res) => {
  const { studentId } = req.body;
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  if (room.status === 'maintenance') {
    return res.status(400).json({ success: false, message: 'Room is under maintenance.' });
  }
  if (room.occupants.length >= room.capacity) {
    return res.status(400).json({ success: false, message: 'Room is at full capacity.' });
  }
  if (room.occupants.includes(studentId)) {
    return res.status(400).json({ success: false, message: 'Student is already assigned to this room.' });
  }

  // Remove from previous room
  if (student.room) {
    await Room.findByIdAndUpdate(student.room, { $pull: { occupants: studentId } });
  }

  room.occupants.push(studentId);
  await room.save();

  student.room = room._id;
  await student.save();

  await room.populate({ path: 'occupants', populate: { path: 'user', select: 'name email' } });
  res.json({ success: true, message: 'Student assigned to room successfully.', data: room });
};

// @desc    Remove student from room
// @route   DELETE /api/rooms/:id/remove/:studentId
// @access  Admin, Warden
const removeStudent = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  room.occupants = room.occupants.filter(id => id.toString() !== req.params.studentId);
  await room.save();

  student.room = null;
  await student.save();

  res.json({ success: true, message: 'Student removed from room.' });
};

// @desc    Get room statistics
// @route   GET /api/rooms/stats
// @access  Admin, Warden
const getRoomStats = async (req, res) => {
  const stats = await Room.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
        totalOccupied: { $sum: { $size: '$occupants' } },
      },
    },
  ]);

  const totalRooms = await Room.countDocuments();
  const totalCapacity = await Room.aggregate([{ $group: { _id: null, total: { $sum: '$capacity' } } }]);
  const totalOccupied = await Room.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$occupants' } } } }]);

  res.json({
    success: true,
    data: {
      byStatus: stats,
      totalRooms,
      totalCapacity: totalCapacity[0]?.total || 0,
      totalOccupied: totalOccupied[0]?.total || 0,
      occupancyRate: totalCapacity[0]?.total
        ? Math.round(((totalOccupied[0]?.total || 0) / totalCapacity[0].total) * 100)
        : 0,
    },
  });
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom, assignStudent, removeStudent, getRoomStats };
