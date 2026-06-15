const express = require('express');
const router = express.Router();
const {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  assignStudent, removeStudent, getRoomStats,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin', 'warden'), getRoomStats);
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', authorize('admin'), createRoom);
router.put('/:id', authorize('admin', 'warden'), updateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);
router.post('/:id/assign', authorize('admin', 'warden'), assignStudent);
router.delete('/:id/remove/:studentId', authorize('admin', 'warden'), removeStudent);

module.exports = router;
