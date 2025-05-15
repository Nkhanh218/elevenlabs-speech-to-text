const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TranscriptSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  fileSize: Number,
  fileDuration: Number,
  fileType: String,
  text: String,
  language_code: String,
  language_probability: Number,
  words: [Schema.Types.Mixed],
  settings: {
    modelId: String,
    diarize: Boolean,
    tagAudioEvents: Boolean,
    timestampsGranularity: String,
    languageCode: String,
    numSpeakers: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transcript', TranscriptSchema); 