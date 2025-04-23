const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, default: () => Date.now().toString() },
  isOfficial: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false }
});

module.exports = mongoose.model('Comment', commentSchema);