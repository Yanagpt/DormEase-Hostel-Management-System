const express = require('express');
const router = express.Router();
const { getNotices, getNotice, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getNotices);
router.get('/:id', getNotice);
router.post('/', authorize('admin', 'warden'), createNotice);
router.put('/:id', authorize('admin', 'warden'), updateNotice);
router.delete('/:id', authorize('admin', 'warden'), deleteNotice);

module.exports = router;
