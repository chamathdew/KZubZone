const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const dramaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalTitle: { type: String },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  synopsisRewrite: { type: String },
  storyOverview: { type: String },
  castOverview: { type: String },
  seriesOverview: { type: String },
  poster: { type: String },
  banner: { type: String },
  backdrops: [{ type: String }],
  releaseDate: { type: Date },
  runtime: { type: Number }, // average runtime of episodes in minutes
  country: { type: String },
  language: { type: String },
  productionCompanies: [{ type: String }],
  tmdbRating: { type: Number, default: 0 },
  imdbRating: { type: Number, default: 0 },
  trailer: { type: String },
  keywords: [{ type: String }],
  images: [{ type: String }],
  cast: [{
    name: { type: String },
    character: { type: String },
    profilePath: { type: String }
  }],
  crew: [{
    name: { type: String },
    job: { type: String },
    department: { type: String }
  }],
  director: { type: String },
  writers: [{ type: String }],
  studio: { type: String },
  viewCount: { type: Number, default: 0, index: true },
  status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  isFeatured: { type: Boolean, default: false, index: true },
  isTrending: { type: Boolean, default: false, index: true },
  tmdbId: { type: Number, unique: true, sparse: true, index: true },

  // AI SEO & Content Generation fields
  aiSeoDescription: { type: String },
  metaTitle: { type: String },
  metaDescription: { type: String },
  seoKeywords: [{ type: String }],
  faq: [faqItemSchema],
  schemaMarkup: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Text index for search queries. Use a non-content field for MongoDB's text-index
// language override so media.language can safely store ISO codes such as "ko".
dramaSchema.index(
  { title: 'text', originalTitle: 'text', description: 'text' },
  { default_language: 'english', language_override: 'textLanguage' }
);

module.exports = mongoose.model('Drama', dramaSchema);
