const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', imageSchema);