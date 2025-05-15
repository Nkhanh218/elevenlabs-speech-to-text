const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Khởi tạo Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @route POST /api/auth/google
 * @desc Xác thực người dùng bằng Google OAuth
 * @access Public
 */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Xác minh token từ Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Tìm kiếm hoặc tạo mới người dùng
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      // Tạo người dùng mới
      user = new User({
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        imageUrl: payload.picture
      });
      
      await user.save();
    } else {
      // Cập nhật thông tin người dùng hiện có
      user.lastLogin = Date.now();
      user.name = payload.name;
      user.imageUrl = payload.picture;
      
      await user.save();
    }
    
    // Tạo JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Trả về token và thông tin người dùng
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Xác thực không thành công' 
    });
  }
});

/**
 * @route GET /api/auth/user
 * @desc Lấy thông tin người dùng hiện tại
 * @access Private
 */
router.get('/user', async (req, res) => {
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

module.exports = router; 