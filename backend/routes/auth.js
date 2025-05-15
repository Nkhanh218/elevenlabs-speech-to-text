const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

// Route đăng nhập với Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route sau khi đăng nhập Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Tạo JWT token
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Điều hướng về client với token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

// Route kiểm tra thông tin người dùng hiện tại
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

// Route lưu API key
router.post('/apikey', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ message: 'API key is required' });
    }
    
    const user = await User.findById(req.user._id);
    user.elevenLabsApiKey = apiKey;
    await user.save();
    
    res.json({ message: 'API key saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving API key', error: error.message });
  }
});

// Route lưu cài đặt người dùng
router.post('/settings', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ message: 'Settings are required' });
    }
    
    const user = await User.findById(req.user._id);
    user.preferredSettings = {
      ...user.preferredSettings,
      ...settings
    };
    await user.save();
    
    res.json({ message: 'Settings saved successfully', settings: user.preferredSettings });
  } catch (error) {
    res.status(500).json({ message: 'Error saving settings', error: error.message });
  }
});

// Route đăng xuất
router.get('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Route xác thực với Google token từ frontend
router.post('/google-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Xác thực token với Google
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Google token payload:', payload);
    
    // Kiểm tra xem người dùng đã tồn tại chưa
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      // Tạo người dùng mới nếu chưa tồn tại
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
      
      await user.save();
      console.log('New user created:', user);
    }
    
    // Tạo JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.picture
      }
    });
  } catch (error) {
    console.error('Google token auth error:', error);
    res.status(500).json({ message: 'Error authenticating with Google', error: error.message });
  }
});

module.exports = router; 