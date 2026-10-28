import mongoose from 'mongoose';

const analysisHistorySchema = new mongoose.Schema(
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
    language: {
      type: String,
      required: true,
      enum: ['python', 'javascript', 'java', 'cpp'],
    },
    code: {
      type: String,
      required: true,
      maxlength: [51200, 'Code size cannot exceed 50 KB'],
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AnalysisHistory = mongoose.model('AnalysisHistory', analysisHistorySchema);
