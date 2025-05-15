const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @route GET /api/user
 * @desc Lấy thông tin người dùng
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-apiKeys');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        settings: user.settings,
        hasApiKey: user.hasApiKey()
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

/**
 * @route POST /api/user/api-key
 * @desc Lưu API key
 * @access Private
 */
router.post('/api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key không được để trống'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Cập nhật API key
    await user.updateApiKey('elevenlabs', apiKey);
    
    res.json({
      success: true,
      message: 'Đã lưu API key thành công'
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

/**
 * @route DELETE /api/user/api-key
 * @desc Xóa API key
 * @access Private
 */
router.delete('/api-key', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Xóa API key
    await user.updateApiKey('elevenlabs', '');
    
    res.json({
      success: true,
      message: 'Đã xóa API key thành công'
    });
  } catch (error) {
    console.error('Error removing API key:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

/**
 * @route PUT /api/user/settings
 * @desc Cập nhật cài đặt người dùng
 * @access Private
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cài đặt'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Cập nhật cài đặt
    user.settings = {
      ...user.settings,
      ...settings
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Đã cập nhật cài đặt thành công',
      settings: user.settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router; 