const Notice = require('../models/Notice');
const { hostelScope } = require('../middleware/auth');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getNotices = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { tag, search } = req.query;

  const filter = { isActive: true };
  const now = new Date();
  filter.$or = [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }];

  if (tag && tag !== 'all') filter.tag = tag;
  if (search) filter.$and = [
    { $or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }] },
  ];

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .populate('postedBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notice.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(notices, total, page, limit) });
};

const getNotice = async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('postedBy', 'name role');
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });

  // Increment view count
  notice.views += 1;
  // Track who read it
  const alreadyRead = notice.readBy.some(r => r.user?.toString() === req.user._id.toString());
  if (!alreadyRead) notice.readBy.push({ user: req.user._id });
  await notice.save({ validateBeforeSave: false });

  res.json({ success: true, data: notice });
};

const createNotice = async (req, res) => {
  const { title, body, tag, targetAudience, isPinned, expiresAt } = req.body;
  const notice = await Notice.create({ hostel: req.hostelId,
    title, body, tag: tag || 'general',
    targetAudience: targetAudience || 'all',
    isPinned: isPinned || false,
    expiresAt: expiresAt || null,
    postedBy: req.user._id,
  });
  await notice.populate('postedBy', 'name role');
  res.status(201).json({ success: true, message: 'Notice posted.', data: notice });
};

const updateNotice = async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('postedBy', 'name role');
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  res.json({ success: true, message: 'Notice updated.', data: notice });
};

const deleteNotice = async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  await notice.deleteOne();
  res.json({ success: true, message: 'Notice deleted.' });
};

module.exports = { getNotices, getNotice, createNotice, updateNotice, deleteNotice };
