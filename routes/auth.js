const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './Uploads/profiles/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('userType').isIn(['normal', 'official']).withMessage('Invalid user type')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, name, email, userType, department } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already exists' });

    user = new User({
      userId: new Date().getTime().toString(),
      username,
      password: await bcrypt.hash(password, 10),
      name,
      email,
      userType: userType || 'normal',
      isOfficial: userType === 'official',
      isAnonymous: false,
      department: userType === 'official' ? department : null
    });

    await user.save();
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET);
    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET);
    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/anonymous', async (req, res) => {
  const user = {
    userId: `anon_${new Date().getTime()}`,
    username: `anonymous${new Date().getTime()}`,
    name: 'Anonymous',
    email: `anonymous${new Date().getTime()}@example.com`,
    userType: 'normal',
    password: '1234',
    isAnonymous: true,
    isOfficial: false,
  };

  try {
    // Save to DB
    await new User(user).save();

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error('Anonymous user creation error:', err);
    res.status(500).json({ message: 'Failed to create anonymous user' });
  }
});

router.put('/profile', authenticateToken, upload.single('image'), [
  body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().matches(/^\d{10}$/).withMessage('Invalid phone number'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { username, email, phone, department } = req.body;
    const oldDepartment = user.department;

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.userId !== user.userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail.userId !== user.userId) {
        return res.status(400).json({ error: 'Email already taken' });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;
    if (user.isOfficial && department) user.department = department;
    if (req.file) {
      if (user.profilePic) {
        const oldPicPath = path.join(__dirname, '..', user.profilePic);
        if (fs.existsSync(oldPicPath)) fs.unlinkSync(oldPicPath);
      }
      user.profilePic = req.file.path;
    }
    await user.save();

    // Update posts and comments
    await Post.updateMany(
      { userId: user.userId },
      { username: user.username, profilePic: user.profilePic }
    );
    await Comment.updateMany(
      { userId: user.userId },
      { userName: user.username }
    );

    // Notify user
    if (user.fcmToken) {
      const message = {
        notification: {
          title: 'Profile Updated',
          body: 'Your profile has been successfully updated.'
        },
        token: user.fcmToken
      };
      await admin.messaging().send(message);
    }

    // Notify users of department change
    if (user.isOfficial && department && department !== oldDepartment) {
      const posts = await Post.find({ department: oldDepartment });
      const userIds = [...new Set(posts.map(post => post.userId))];
      const users = await User.find({ userId: { $in: userIds }, fcmToken: { $exists: true } });
      for (const u of users) {
        const message = {
          notification: {
            title: 'Department Official Changed',
            body: `The official for ${department} has updated their profile.`
          },
          token: u.fcmToken
        };
        await admin.messaging().send(message);
      }
    }

    res.json({ message: 'Profile updated successfully', user: { ...user._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/fcm-token', authenticateToken, async (req, res) => {
  const { fcmToken } = req.body;
  const user = await User.findOne({ userId: req.user.userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.fcmToken = fcmToken;
  await user.save();
  res.json({ message: 'FCM token updated' });
});

router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;