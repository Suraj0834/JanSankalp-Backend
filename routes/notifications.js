const express = require('express');
const authenticateToken = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, message, postTitle } = req.body;
  try {
    const notification = new Notification({
      userId: req.user.userId,
      title,
      message,
      postTitle
    });
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;