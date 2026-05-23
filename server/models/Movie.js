const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalTitle: { type: String },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  synopsisRewrite: { type: String },
  storyOverview: { type: String },
  castOverview: { type: String },
  poster: { type: String },
  banner: { type: String },
  backdrops: [{ type: String }],
  releaseDate: { type: Date },
  runtime: { type: Number }, // in minutes
  country: { type: String },
  language: { type: String },
  productionCompanies: [{ type: String }],
  tmdbRating: { type: Number, default: 0 },
  imdbRating: { type: Number, default: 0 },
  trailer: { type: String }, // link to trailer
  keywords: [{ type: String }],
  collectionInfo: {
    id: { type: Number },
    name: { type: String },
    posterPath: { type: String },
    backdropPath: { type: String }
  },
  images: [{ type: String }],
  relatedTitles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
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

  // SEO & AI Generated fields
  aiSeoDescription: { type: String },
  metaTitle: { type: String },
  metaDescription: { type: String },
  seoKeywords: [{ type: String }],
  faq: [faqItemSchema],
  schemaMarkup: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Index for search queries. Use a non-content field for MongoDB's text-index
// language override so media.language can safely store ISO codes such as "ko".
movieSchema.index(
  { title: 'text', originalTitle: 'text', description: 'text' },
  { default_language: 'english', language_override: 'textLanguage' }
);

module.exports = mongoose.model('Movie', movieSchema);
