const mongoose = require('mongoose');

const companyCacheSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  techStack: [{
    type: String,
    trim: true
  }],
  lastFetched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster searches
companyCacheSchema.index({ name: 1 });
companyCacheSchema.index({ lastFetched: 1 });

module.exports = mongoose.model('CompanyCache', companyCacheSchema);