const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  tmdbId: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Genre', genreSchema);
