const express = require('express');
const authenticateToken = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ officialId: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, description, dueDate } = req.body;
  try {
    const task = new Task({
      officialId: req.user.userId,
      title,
      description,
      dueDate
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;