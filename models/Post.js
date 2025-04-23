const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  hashtags: [{ type: String }],
  department: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  imageId: { type: String },
  date: { type: String, default: () => Date.now().toString() },
  isAnonymous: { type: Boolean, default: false },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  officialComments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  username: { type: String, required: true },
  profilePic: { type: String }
});

postSchema.index({ department: 1 });

module.exports = mongoose.model('Post', postSchema);