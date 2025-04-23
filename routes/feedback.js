const express = require('express');
const authenticateToken = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const mongoose = require('mongoose');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  console.log('POST /api/feedback body:', req.body); // Debug log
  const { complaintId, content, userId } = req.body;
  try {
    // Validate inputs
    if (!complaintId || !content || !userId) {
      return res.status(400).json({ message: 'Missing required fields: complaintId, content, userId' });
    }
    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }
    if (content.length < 10) {
      return res.status(400).json({ message: 'Feedback must be at least 10 characters' });
    }

    // Verify user
    const user = await User.findOne({ userId });
    if (!user || user.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized user' });
    }

    // Verify complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (complaint.userId !== user.userId || complaint.status !== 'Completed') {
      return res.status(403).json({ message: 'Feedback can only be submitted for your completed complaints' });
    }

    // Create feedback
    const feedback = new Feedback({
      userId,
      complaintId,
      content
    });
    await feedback.save();

    // Return feedback with stringified complaintId
    res.json({
      _id: feedback._id.toString(),
      userId: feedback.userId,
      complaintId: feedback.complaintId.toString(),
      content: feedback.content,
      date: feedback.date.toISOString()
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;