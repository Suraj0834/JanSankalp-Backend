const express = require('express');
const authenticateToken = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const admin = require('firebase-admin');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    console.log(user);
    
    const query = user.isOfficial ? { department: user.department, isAnonymous: false } : { isAnonymous: false };
    const posts = await Post.find(query)
      .populate('comments')
      .populate('officialComments')
      .lean();
    res.json(posts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments')
      .populate('officialComments')
      .lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.isAnonymous && req.user.isAnonymous) {
      return res.status(403).json({ message: 'Anonymous users cannot view anonymous posts' });
    }
    res.json(post);
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, description, location, hashtags, department, imageId } = req.body;
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (user.isAnonymous) return res.status(403).json({ message: 'Anonymous users cannot post' });
    if (imageId && !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({ message: 'Invalid imageId' });
    }
    const post = new Post({
      userId: user.userId,
      title,
      description,
      location,
      hashtags: hashtags || [],
      department,
      imageId: imageId || null,
      username: user.username,
      profilePic: user.profilePic,
      isAnonymous: false,
      status: 'Pending',
      upvotes: 0,
      downvotes: 0,
      date: Date.now()
    });
    await post.save();
    const complaint = new Complaint({
      userId: user.userId,
      title,
      description,
      location,
      department,
      status: 'Pending',
      postId: post._id
    });
    await complaint.save();
    if (!user.isAnonymous) {
      const message = {
        notification: {
          title: 'New Complaint',
          body: `A new complaint in ${post.department}: ${post.title}`
        },
        topic: post.department
      };
      await admin.messaging().send(message);
    }
    res.json(post);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const user = await User.findOne({ userId: req.user.userId });
    if (!user.isOfficial || user.department !== post.department) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    post.status = status;
    await post.save();
    await Complaint.updateOne({ postId: post._id }, { status });
    const postOwner = await User.findOne({ userId: post.userId });
    if (postOwner.fcmToken) {
      const message = {
        notification: {
          title: 'Post Status Updated',
          body: `Your complaint "${post.title}" is now ${status}`
        },
        token: postOwner.fcmToken
      };
      await admin.messaging().send(message);
    }
    res.json(post);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (user.isAnonymous) return res.status(403).json({ message: 'Anonymous users cannot upvote' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.upvotes += 1;
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/downvote', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (user.isAnonymous) return res.status(403).json({ message: 'Anonymous users cannot downvote' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.downvotes += 1;
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Downvote error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comment', authenticateToken, async (req, res) => {
  const { content, isOfficial } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const user = await User.findOne({ userId: req.user.userId });
    if (user.isAnonymous) return res.status(403).json({ message: 'Anonymous users cannot comment' });
    const comment = new Comment({
      userId: user.userId,
      username: user.username,
      content,
      isOfficial: user.isOfficial && isOfficial,
      isAnonymous: false,
      date: Date.now(),
      postId: post._id
    });
    await comment.save();
    if (comment.isOfficial) post.officialComments.push(comment._id);
    else post.comments.push(comment._id);
    await post.save();
    const postOwner = await User.findOne({ userId: post.userId });
    if (postOwner.fcmToken && postOwner.userId !== user.userId) {
      const message = {
        notification: {
          title: 'New Comment',
          body: `Your post "${post.title}" received a ${comment.isOfficial ? 'official' : 'regular'} comment`
        },
        token: postOwner.fcmToken
      };
      await admin.messaging().send(message);
    }
    res.json(comment);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    console.error('Get comment error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;