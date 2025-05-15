const express = require('express');
const router = express.Router();
const passport = require('passport');
const Transcript = require('../models/Transcript');

// Lấy tất cả lịch sử chuyển đổi của người dùng
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const transcripts = await Transcript.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transcripts', error: error.message });
  }
});

// Lấy chi tiết một bản ghi chuyển đổi
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }
    
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transcript', error: error.message });
  }
});

// Lưu một bản ghi chuyển đổi mới
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      fileDuration,
      fileType,
      text,
      language_code,
      language_probability,
      words,
      settings
    } = req.body;
    
    const newTranscript = new Transcript({
      userId: req.user._id,
      fileName,
      fileSize,
      fileDuration,
      fileType,
      text,
      language_code,
      language_probability,
      words,
      settings
    });
    
    const savedTranscript = await newTranscript.save();
    res.status(201).json(savedTranscript);
  } catch (error) {
    res.status(500).json({ message: 'Error saving transcript', error: error.message });
  }
});

// Xóa một bản ghi chuyển đổi
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const transcript = await Transcript.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }
    
    res.json({ message: 'Transcript deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transcript', error: error.message });
  }
});

module.exports = router; 