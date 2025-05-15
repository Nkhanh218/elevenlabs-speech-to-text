const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

// API base của ElevenLabs
const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';

/**
 * @route POST /api/elevenlabs/transcribe
 * @desc Gọi ElevenLabs Speech-to-Text API
 * @access Private
 */
router.post('/transcribe', async (req, res) => {
  try {
    // Lấy API key người dùng
    const apiKey = req.header('X-ElevenLabs-API-Key');
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu API key ElevenLabs'
      });
    }
    
    // Kiểm tra file
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được gửi'
      });
    }
    
    // Tạo FormData
    const formData = new FormData();
    
    // Thêm file vào form
    const audioFile = req.files.file;
    formData.append('file', audioFile.data, {
      filename: audioFile.name,
      contentType: audioFile.mimetype
    });
    
    // Thêm các tham số khác
    for (const [key, value] of Object.entries(req.body)) {
      formData.append(key, value);
    }
    
    // Gọi API ElevenLabs
    const response = await axios.post(`${ELEVENLABS_API_URL}/speech-to-text`, formData, {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Trả về kết quả
    res.json(response.data);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    
    // Trả về lỗi từ ElevenLabs nếu có
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Lỗi từ ElevenLabs API',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gọi ElevenLabs API'
    });
  }
});

/**
 * @route GET /api/elevenlabs/voices
 * @desc Lấy danh sách giọng nói từ ElevenLabs
 * @access Private
 */
router.get('/voices', async (req, res) => {
  try {
    // Lấy người dùng để kiểm tra API key
    const user = await User.findById(req.user.id);
    
    if (!user.hasApiKey('elevenlabs')) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa thiết lập API key ElevenLabs'
      });
    }
    
    // Gọi API ElevenLabs
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': user.apiKeys.elevenlabs
      }
    });
    
    // Trả về kết quả
    res.json(response.data);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Lỗi từ ElevenLabs API'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gọi ElevenLabs API'
    });
  }
});

/**
 * @route GET /api/elevenlabs/models
 * @desc Lấy danh sách mô hình từ ElevenLabs
 * @access Private
 */
router.get('/models', async (req, res) => {
  try {
    // Lấy người dùng để kiểm tra API key
    const user = await User.findById(req.user.id);
    
    if (!user.hasApiKey('elevenlabs')) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa thiết lập API key ElevenLabs'
      });
    }
    
    // Gọi API ElevenLabs
    const response = await axios.get(`${ELEVENLABS_API_URL}/models`, {
      headers: {
        'xi-api-key': user.apiKeys.elevenlabs
      }
    });
    
    // Trả về kết quả
    res.json(response.data);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Lỗi từ ElevenLabs API'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gọi ElevenLabs API'
    });
  }
});

module.exports = router; 