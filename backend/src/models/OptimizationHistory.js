import mongoose from 'mongoose';

const optimizationHistorySchema = new mongoose.Schema(
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
    originalCode: {
      type: String,
      required: true,
      maxlength: [51200, 'Code size cannot exceed 50 KB'],
    },
    optimizedCode: {
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

export const OptimizationHistory = mongoose.model('OptimizationHistory', optimizationHistorySchema);
