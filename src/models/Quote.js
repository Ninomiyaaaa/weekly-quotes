import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  issueNumber: {
    type: Number,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  pushedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  error: {
    type: String
  }
});

// 创建索引
quoteSchema.index({ issueNumber: 1 });
quoteSchema.index({ fetchedAt: -1 });

export const Quote = mongoose.model('Quote', quoteSchema); 