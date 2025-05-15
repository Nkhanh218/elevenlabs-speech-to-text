const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

// Load biến môi trường
dotenv.config({ path: __dirname + '/.env' });
console.log('JWT Secret:', process.env.JWT_SECRET); // Debug log

// Kết nối cơ sở dữ liệu
connectDB();

// Khởi tạo ứng dụng
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Cấu hình Passport
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transcripts', require('./routes/transcripts'));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'ElevenLabs Speech-to-Text API' });
});

// Khởi chạy máy chủ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 