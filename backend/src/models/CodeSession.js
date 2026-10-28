import mongoose from 'mongoose';

const codeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: 'Untitled Session',
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['python', 'javascript', 'java', 'cpp'],
      default: 'python',
    },
    code: {
      type: String,
      required: [true, 'Code content is required'],
      maxlength: [51200, 'Code size cannot exceed 50 KB'],
    },
  },
  {
    timestamps: true,
  }
);

export const CodeSession = mongoose.model('CodeSession', codeSessionSchema);
