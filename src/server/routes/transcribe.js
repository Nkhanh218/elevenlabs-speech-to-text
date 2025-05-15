const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Transcript = require('../models/Transcript');
const User = require('../models/User');

/**
 * @route POST /api/transcribe
 * @desc Chuyển đổi file âm thanh sang văn bản
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    // Kiểm tra xem có file nào được gửi lên
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được gửi'
      });
    }
    
    const audioFile = req.files.file;
    const fileExt = path.extname(audioFile.name).toLowerCase();
    
    // Kiểm tra loại file
    const allowedTypes = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm', '.flac'];
    if (!allowedTypes.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `Định dạng file không được hỗ trợ. Hỗ trợ: ${allowedTypes.join(', ')}`
      });
    }
    
    // Lưu file vào thư mục tạm
    const fileName = `${uuidv4()}${fileExt}`;
    const uploadPath = path.join(__dirname, '../uploads', fileName);
    
    await audioFile.mv(uploadPath);
    
    // Lấy API key của người dùng
    const user = await User.findById(req.user.id);
    if (!user.hasApiKey('elevenlabs')) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa thiết lập API key ElevenLabs'
      });
    }
    
    // Tùy chọn chuyển đổi từ người dùng
    const options = {
      modelId: req.body.model_id || 'whisper-1',
      languageCode: req.body.language_code,
      numSpeakers: parseInt(req.body.num_speakers) || 2,
      diarize: req.body.diarize !== 'false',
      tagAudioEvents: req.body.tag_audio_events !== 'false',
      timestampsGranularity: req.body.timestamps_granularity || 'word'
    };
    
    // Tạo form-data để gửi đến API ElevenLabs
    const formData = new FormData();
    formData.append('file', fs.createReadStream(uploadPath));
    formData.append('model_id', options.modelId);
    
    if (options.languageCode) {
      formData.append('language_code', options.languageCode);
    }
    
    formData.append('num_speakers', options.numSpeakers.toString());
    formData.append('diarize', options.diarize.toString());
    formData.append('tag_audio_events', options.tagAudioEvents.toString());
    formData.append('timestamps_granularity', options.timestampsGranularity);
    
    // Gọi API ElevenLabs
    const response = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'xi-api-key': user.apiKeys.elevenlabs
      }
    });
    
    // Lưu kết quả vào cơ sở dữ liệu
    const transcript = new Transcript({
      userId: user._id,
      fileName: audioFile.name,
      fileType: audioFile.mimetype,
      fileSize: audioFile.size,
      originalFilePath: uploadPath,
      text: response.data.text,
      language_code: response.data.language_code,
      language_probability: response.data.language_probability,
      words: response.data.words,
      audio_events: response.data.audio_events,
      modelId: options.modelId,
      settings: options
    });
    
    await transcript.save();
    
    // Trả về kết quả
    res.json({
      success: true,
      transcript: {
        id: transcript._id,
        text: transcript.text,
        language: transcript.language_code,
        language_probability: transcript.language_probability,
        words: transcript.words,
        audio_events: transcript.audio_events
      }
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || error.message || 'Lỗi server'
    });
  }
});

/**
 * @route GET /api/transcribe/history
 * @desc Lấy lịch sử chuyển đổi
 * @access Private
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transcripts = await Transcript.findByUserId(req.user.id, limit, skip);
    const total = await Transcript.countDocuments({ userId: req.user.id });
    
    res.json(transcripts);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử chuyển đổi'
    });
  }
});

/**
 * @route GET /api/transcribe/:id
 * @desc Lấy chi tiết một bản ghi chuyển đổi
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi chuyển đổi'
      });
    }
    
    res.json(transcript);
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết bản ghi chuyển đổi'
    });
  }
});

/**
 * @route DELETE /api/transcribe/:id
 * @desc Xóa một bản ghi chuyển đổi
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi chuyển đổi'
      });
    }
    
    // Xóa file nếu tồn tại
    if (transcript.originalFilePath && fs.existsSync(transcript.originalFilePath)) {
      fs.unlinkSync(transcript.originalFilePath);
    }
    
    await transcript.remove();
    
    res.json({
      success: true,
      message: 'Đã xóa bản ghi chuyển đổi thành công'
    });
  } catch (error) {
    console.error('Delete transcript error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bản ghi chuyển đổi'
    });
  }
});

/**
 * @route POST /api/transcribe/search
 * @desc Tìm kiếm trong các bản ghi chuyển đổi
 * @access Private
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Từ khóa tìm kiếm không được để trống'
      });
    }
    
    const results = await Transcript.search(req.user.id, query);
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm bản ghi chuyển đổi'
    });
  }
});

module.exports = router; 