const express = require('express');
const authenticateToken = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const query = user.isOfficial
      ? { department: user.department }
      : { userId: user.userId };
    const complaints = await Complaint.find(query);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.userId !== user.userId && !(user.isOfficial && complaint.department === user.department)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Complaint.deleteOne({ _id: req.params.id });
    res.status(200).json({});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;