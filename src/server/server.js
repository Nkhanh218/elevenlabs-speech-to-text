const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Tải cấu hình từ .env
dotenv.config();

// Kết nối database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'temp')
}));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn mỗi IP 100 request trong 15 phút
  standardHeaders: true,
  message: {
    success: false,
    message: 'Quá nhiều request, vui lòng thử lại sau 15 phút'
  }
});

// Auth middleware
const auth = (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Không có token xác thực' 
      });
    }
    
    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token không hợp lệ' 
    });
  }
};

// Áp dụng rate limiter cho tất cả các route API
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', auth, require('./routes/user'));
app.use('/api/transcribe', auth, require('./routes/transcribe'));
app.use('/api/elevenlabs', auth, require('./routes/elevenlabs'));

// Phục vụ file tĩnh trong production
if (process.env.NODE_ENV === 'production') {
  // Set thư mục tĩnh
  app.use(express.static(path.join(__dirname, '../../build')));

  // Mọi route không khớp sẽ trả về index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../build', 'index.html'));
  });
}

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
}); 