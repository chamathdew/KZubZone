const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // e.g. "featured-hero", "trending-now", "latest-dramas"
  order: { type: Number, default: 0 },
  type: { type: String, enum: ['slider', 'grid', 'carousel', 'list'], default: 'grid' },
  items: [{
    mediaId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mediaType: { type: String, enum: ['Movie', 'Drama'], required: true }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
