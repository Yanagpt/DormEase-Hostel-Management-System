const express = require('express');
const router = express.Router();
const {
  getUsers, getStudents, getStudent, getMyStudentProfile,
  createStudent, createWarden, updateStudent, toggleUserStatus, deleteUser, resetPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/students', authorize('admin', 'warden'), getStudents);
router.get('/me/student', authorize('student'), getMyStudentProfile);
router.post('/students', authorize('admin'), createStudent);
router.post('/wardens', authorize('admin'), createWarden);
router.get('/students/:id', getStudent);
router.put('/students/:id', updateStudent);
router.put('/:id/toggle-status', authorize('admin'), toggleUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

router.put('/:id/reset-password', authorize('admin'), resetPassword);

module.exports = router;