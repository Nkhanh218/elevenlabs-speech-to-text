const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/elevenlabs-stt';
    
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
    
    // Bắt sự kiện kết nối thất bại
    mongoose.connection.on('error', (err) => {
      console.error(`Lỗi kết nối MongoDB: ${err.message}`);
    });
    
    // Bắt sự kiện mất kết nối
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB bị ngắt kết nối, đang thử kết nối lại...');
    });
    
    // Bắt sự kiện khi ứng dụng kết thúc
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Đã đóng kết nối MongoDB do ứng dụng kết thúc');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error(`Lỗi khi kết nối đến MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 