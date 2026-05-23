const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  characterName: { type: String },
  profilePath: { type: String },
  tmdbId: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Actor', actorSchema);
