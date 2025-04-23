const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const admin = require('firebase-admin');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const complaintRoutes = require('./routes/complaints');
const eventRoutes = require('./routes/events');
const notificationRoutes = require('./routes/notifications');
const taskRoutes = require('./routes/tasks');
const feedbackRoutes = require('./routes/feedback');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Body:`, req.body);
  next();
});

// Firebase Admin Setup
try {
  admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-adminsdk.json'))
  });
  console.log('Firebase Admin initialized');
} catch (err) {
  console.error('Firebase Admin initialization failed:', err.message);
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};
connectDB();

// GridFS Setup
let gfs;
mongoose.connection.once('open', () => {
  try {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'Uploads' });
    console.log('GridFS initialized');
  } catch (err) {
    console.error('GridFS initialization failed:', err.message);
    process.exit(1);
  }
});

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'Uploads'
  })
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG images allowed'));
    }
    cb(null, true);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/feedback', feedbackRoutes);

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ imageId: req.file.id.toString() });
});

// Serve Images
app.get('/api/images/:imageId', (req, res) => {
  if (!gfs) return res.status(500).json({ message: 'GridFS not initialized' });
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.imageId);
    gfs.openDownloadStream(fileId).pipe(res).on('error', () => {
      res.status(404).json({ message: 'File not found' });
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid image ID' });
  }
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));