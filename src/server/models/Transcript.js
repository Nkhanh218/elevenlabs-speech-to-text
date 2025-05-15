const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TranscriptSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  originalFilePath: {
    type: String
  },
  duration: {
    type: Number
  },
  text: {
    type: String,
    required: true
  },
  language_code: {
    type: String
  },
  language_probability: {
    type: Number
  },
  words: [{
    word: String,
    start: Number,
    end: Number,
    confidence: Number,
    speaker: String
  }],
  audio_events: [{
    type: String,
    start: Number,
    end: Number
  }],
  modelId: {
    type: String,
    default: 'whisper-1'
  },
  settings: {
    numSpeakers: Number,
    diarize: Boolean,
    tagAudioEvents: Boolean,
    timestampsGranularity: String
  }
}, { 
  timestamps: true 
});

// Index cho tìm kiếm full-text
TranscriptSchema.index({ text: 'text', fileName: 'text' });

// Phương thức dùng cho tìm kiếm
TranscriptSchema.statics.search = function(userId, query) {
  return this.find({ 
    userId,
    $text: { $search: query }
  }).sort({ 
    score: { $meta: 'textScore' } 
  });
};

// Phương thức để lấy tất cả bản ghi của một người dùng
TranscriptSchema.statics.findByUserId = function(userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Tạo và export model
module.exports = mongoose.model('Transcript', TranscriptSchema); 