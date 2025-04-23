const express = require('express');
const authenticateToken = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const admin = require('firebase-admin');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, description, date, location, status } = req.body;
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user.isOfficial) return res.status(403).json({ message: 'Only officials can create events' });
    const event = new Event({
      title,
      description,
      date,
      location,
      status,
      department: user.department,
      createdBy: user.userId
    });
    await event.save();
    const message = {
      notification: {
        title: 'New Event',
        body: `Upcoming event: ${title} by ${user.department}`
      },
      topic: 'all_users'
    };
    await admin.messaging().send(message);
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;