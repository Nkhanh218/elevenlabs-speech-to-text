const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: String,
  elevenLabsApiKey: {
    type: String,
    default: ''
  },
  preferredSettings: {
    modelId: { type: String, default: 'scribe_v1' },
    diarize: { type: Boolean, default: true },
    tagAudioEvents: { type: Boolean, default: true },
    timestampsGranularity: { type: String, default: 'word' },
    languageCode: { type: String, default: 'vi' },
    numSpeakers: { type: String, default: '2' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema); 