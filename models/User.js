const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true },
  userType: { type: String, enum: ['normal', 'official'], default: 'normal' },
  isOfficial: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  department: { type: String, default: null },
  phone: { type: String, default: null },
  profilePic: { type: String, default: null },
  fcmToken: { type: String, default: null }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);