const Drama = require('../models/Drama');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const aiSeoController = require('./aiSeoController');

// GET ALL DRAMAS
exports.getAllDramas = async (req, res, next) => {
  const { page = 1, limit = 12, search, genre, year, country, language, rating, sort, status } = req.query;

  try {
    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = 'Published';
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (genre) {
      query.keywords = { $in: [new RegExp(genre, 'i')] };
    }

    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: start, $lte: end };
    }

    if (country) {
      query.country = country;
    }

    if (language) {
      query.language = language;
    }

    if (rating) {
      query.tmdbRating = { $gte: Number(rating) };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { releaseDate: 1 };
    } else if (sort === 'newest') {
      sortOptions = { releaseDate: -1 };
    } else if (sort === 'rating') {
      sortOptions = { tmdbRating: -1 };
    } else if (sort === 'popular') {
      sortOptions = { viewCount: -1 };
    } else if (sort === 'views') {
      sortOptions = { viewCount: -1 };
    } else if (sort === 'az') {
      sortOptions = { title: 1 };
    }

    const skipIndex = (page - 1) * limit;
    const total = await Drama.countDocuments(query);
    const dramas = await Drama.find(query)
      .sort(sortOptions)
      .skip(skipIndex)
      .limit(Number(limit));

    return res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      dramas
    });
  } catch (error) {
    next(error);
  }
};

// GET DRAMA BY SLUG (Includes Season list & Episodes)
exports.getDramaBySlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const drama = await Drama.findOne({ slug });
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    // Increment views
    drama.viewCount += 1;
    await drama.save();

    // Fetch seasons
    const seasons = await Season.find({ dramaId: drama._id }).sort({ seasonNumber: 1 });
    
    // Fetch episodes for all seasons
    const episodes = await Episode.find({ dramaId: drama._id }).sort({ seasonId: 1, episodeNumber: 1 });

    // Related dramas
    const related = await Drama.find({
      _id: { $ne: drama._id },
      keywords: { $in: drama.keywords }
    }).limit(4);

    return res.status(200).json({ drama, seasons, episodes, related });
  } catch (error) {
    next(error);
  }
};

// CREATE DRAMA (MANUAL ADMIN)
exports.createDrama = async (req, res, next) => {
  const data = req.body;
  if (!data.title) {
    return res.status(400).json({ message: 'Drama Title is required' });
  }

  try {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    data.slug = slug;

    // Generate AI content automatically
    const seoContent = aiSeoController.generateSeoForTitle(data.title, data.description || '', 'Drama', {
      genres: data.keywords || [],
      releaseDate: data.releaseDate || new Date(),
      director: data.director || '',
      cast: data.cast ? data.cast.map(c => c.name) : []
    });

    const finalDramaData = { ...data, ...seoContent };
    const drama = new Drama(finalDramaData);
    await drama.save();

    return res.status(201).json({ message: 'Drama created successfully', drama });
  } catch (error) {
    next(error);
  }
};

// UPDATE DRAMA
exports.updateDrama = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    let drama = await Drama.findById(id);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    if (updates.title || updates.description) {
      const title = updates.title || drama.title;
      const desc = updates.description || drama.description;
      const seoContent = aiSeoController.generateSeoForTitle(title, desc, 'Drama', {
        genres: updates.keywords || drama.keywords || [],
        releaseDate: updates.releaseDate || drama.releaseDate || new Date(),
        director: updates.director || drama.director || '',
        cast: updates.cast ? updates.cast.map(c => c.name) : (drama.cast || []).map(c => c.name)
      });
      Object.assign(updates, seoContent);
    }

    drama = await Drama.findByIdAndUpdate(id, updates, { new: true });
    return res.status(200).json({ message: 'Drama updated successfully', drama });
  } catch (error) {
    next(error);
  }
};

// DELETE DRAMA
exports.deleteDrama = async (req, res, next) => {
  const { id } = req.params;
  try {
    const drama = await Drama.findByIdAndDelete(id);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }
    // Delete cascading seasons and episodes
    await Season.deleteMany({ dramaId: id });
    await Episode.deleteMany({ dramaId: id });

    return res.status(200).json({ message: 'Drama and cascading seasons/episodes deleted' });
  } catch (error) {
    next(error);
  }
};

/* --- SEASON MANAGEMENT --- */

exports.addSeason = async (req, res, next) => {
  const { dramaId, seasonNumber, seasonDescription, seasonPoster, airDate } = req.body;
  if (!dramaId || !seasonNumber) {
    return res.status(400).json({ message: 'Drama ID and Season Number are required' });
  }

  try {
    const season = new Season({ dramaId, seasonNumber, seasonDescription, seasonPoster, airDate });
    await season.save();
    return res.status(201).json({ message: 'Season added successfully', season });
  } catch (error) {
    next(error);
  }
};

exports.editSeason = async (req, res, next) => {
  const { id } = req.params;
  try {
    const season = await Season.findByIdAndUpdate(id, req.body, { new: true });
    if (!season) return res.status(404).json({ message: 'Season not found' });
    return res.status(200).json({ message: 'Season updated successfully', season });
  } catch (error) {
    next(error);
  }
};

exports.deleteSeason = async (req, res, next) => {
  const { id } = req.params;
  try {
    const season = await Season.findByIdAndDelete(id);
    if (!season) return res.status(404).json({ message: 'Season not found' });
    // Cascade delete episodes
    await Episode.deleteMany({ seasonId: id });
    return res.status(200).json({ message: 'Season and episodes deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/* --- EPISODE MANAGEMENT --- */

exports.addEpisode = async (req, res, next) => {
  const { dramaId, seasonId, episodeNumber, episodeTitle, episodeDescription, episodeThumbnail, airDate, runtime, trailer, videoUrl } = req.body;
  if (!dramaId || !seasonId || !episodeNumber || !episodeTitle) {
    return res.status(400).json({ message: 'Drama ID, Season ID, Episode Number, and Title are required' });
  }

  try {
    const season = await Season.findById(seasonId);
    const drama = await Drama.findById(dramaId);
    if (!season || !drama) {
      return res.status(404).json({ message: 'Drama or Season parent reference not found' });
    }

    const episodeSchemaMarkup = {
      "@context": "https://schema.org",
      "@type": "TVEpisode",
      "name": episodeTitle,
      "episodeNumber": episodeNumber,
      "description": episodeDescription,
      "datePublished": airDate || null,
      "partOfSeason": {
        "@type": "TVSeason",
        "seasonNumber": season.seasonNumber
      },
      "partOfSeries": {
        "@type": "TVSeries",
        "name": drama.title
      }
    };

    const episode = new Episode({
      dramaId,
      seasonId,
      episodeNumber,
      episodeTitle,
      episodeDescription,
      episodeThumbnail,
      airDate,
      runtime,
      trailer,
      videoUrl,
      aiEpisodeSummary: `AI generated recap for ${drama.title} S${season.seasonNumber}E${episodeNumber}: ${episodeDescription || ''}`,
      episodeSchemaMarkup
    });

    await episode.save();
    return res.status(201).json({ message: 'Episode created successfully', episode });
  } catch (error) {
    next(error);
  }
};

exports.editEpisode = async (req, res, next) => {
  const { id } = req.params;
  try {
    const episode = await Episode.findByIdAndUpdate(id, req.body, { new: true });
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    return res.status(200).json({ message: 'Episode updated successfully', episode });
  } catch (error) {
    next(error);
  }
};

exports.deleteEpisode = async (req, res, next) => {
  const { id } = req.params;
  try {
    const episode = await Episode.findByIdAndDelete(id);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    return res.status(200).json({ message: 'Episode deleted successfully' });
  } catch (error) {
    next(error);
  }
};
