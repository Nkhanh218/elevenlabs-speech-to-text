const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String
  },
  apiKeys: {
    elevenlabs: {
      type: String,
      required: false
    }
  },
  settings: {
    defaultLanguage: {
      type: String,
      default: 'vi'
    },
    defaultModelId: {
      type: String,
      default: 'whisper-1'
    },
    defaultNumSpeakers: {
      type: Number,
      default: 2
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Middleware trước khi lưu để mã hóa API key nếu cần
UserSchema.pre('save', function(next) {
  // Đây là nơi để thêm mã hóa API key nếu cần
  // Trong môi trường production, bạn nên mã hóa API key trước khi lưu vào DB
  next();
});

// Method để kiểm tra xem API key có được thiết lập hay không
UserSchema.methods.hasApiKey = function(provider = 'elevenlabs') {
  return this.apiKeys && this.apiKeys[provider] && this.apiKeys[provider].length > 0;
};

// Method để cập nhật API key
UserSchema.methods.updateApiKey = function(provider, apiKey) {
  if (!this.apiKeys) {
    this.apiKeys = {};
  }
  this.apiKeys[provider] = apiKey;
  return this.save();
};

// Tạo và export model
module.exports = mongoose.model('User', UserSchema); 