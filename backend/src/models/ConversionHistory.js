import mongoose from 'mongoose';

const conversionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodeSession',
      default: null,
      index: true,
    },
    sourceLanguage: {
      type: String,
      required: true,
      enum: ['python', 'javascript', 'java', 'cpp'],
    },
    targetLanguage: {
      type: String,
      required: true,
      enum: ['python', 'javascript', 'java', 'cpp'],
    },
    sourceCode: {
      type: String,
      required: true,
      maxlength: [51200, 'Code size cannot exceed 50 KB'],
    },
    convertedCode: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const ConversionHistory = mongoose.model('ConversionHistory', conversionHistorySchema);
