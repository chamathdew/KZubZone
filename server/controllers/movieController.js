const Movie = require('../models/Movie');
const Genre = require('../models/Genre');
const aiSeoController = require('./aiSeoController');

// GET ALL MOVIES (with pagination, filters & sorting)
exports.getAllMovies = async (req, res, next) => {
  const { page = 1, limit = 12, search, genre, year, country, language, rating, sort, status } = req.query;

  try {
    const query = {};

    // Apply Admin vs Public Status
    if (status) {
      query.status = status;
    } else {
      query.status = 'Published';
    }

    // Apply Search
    if (search) {
      query.$text = { $search: search };
    }

    // Apply Genre filter
    if (genre) {
      query.keywords = { $in: [new RegExp(genre, 'i')] }; // or check genres field
    }

    // Apply Year filter
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: start, $lte: end };
    }

    // Apply Country filter
    if (country) {
      query.country = country;
    }

    // Apply Language filter
    if (language) {
      query.language = language;
    }

    // Apply Rating filter (greater than or equal to)
    if (rating) {
      query.tmdbRating = { $gte: Number(rating) };
    }

    // Determine Sorting
    let sortOptions = { createdAt: -1 }; // default newest
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
    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort(sortOptions)
      .skip(skipIndex)
      .limit(Number(limit));

    return res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      movies
    });
  } catch (error) {
    next(error);
  }
};

// GET MOVIE BY SLUG
exports.getMovieBySlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Increment viewCount
    movie.viewCount += 1;
    await movie.save();

    // Find related titles (same genre/keywords)
    const related = await Movie.find({
      _id: { $ne: movie._id },
      keywords: { $in: movie.keywords }
    }).limit(4);

    return res.status(200).json({ movie, related });
  } catch (error) {
    next(error);
  }
};

// CREATE MOVIE (MANUAL ADMIN)
exports.createMovie = async (req, res, next) => {
  const data = req.body;
  if (!data.title) {
    return res.status(400).json({ message: 'Movie Title is required' });
  }

  try {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    data.slug = slug;

    // Auto-trigger AI SEO content generation if description is provided
    const seoContent = aiSeoController.generateSeoForTitle(data.title, data.description || '', 'Movie', {
      genres: data.keywords || [],
      releaseDate: data.releaseDate || new Date(),
      director: data.director || '',
      cast: data.cast ? data.cast.map(c => c.name) : []
    });

    const finalMovieData = { ...data, ...seoContent };
    const movie = new Movie(finalMovieData);
    await movie.save();

    return res.status(201).json({ message: 'Movie created successfully', movie });
  } catch (error) {
    next(error);
  }
};

// UPDATE MOVIE
exports.updateMovie = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    let movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Re-generate SEO content if title or description changes
    if (updates.title || updates.description) {
      const title = updates.title || movie.title;
      const desc = updates.description || movie.description;
      const seoContent = aiSeoController.generateSeoForTitle(title, desc, 'Movie', {
        genres: updates.keywords || movie.keywords || [],
        releaseDate: updates.releaseDate || movie.releaseDate || new Date(),
        director: updates.director || movie.director || '',
        cast: updates.cast ? updates.cast.map(c => c.name) : (movie.cast || []).map(c => c.name)
      });
      Object.assign(updates, seoContent);
    }

    movie = await Movie.findByIdAndUpdate(id, updates, { new: true });
    return res.status(200).json({ message: 'Movie updated successfully', movie });
  } catch (error) {
    next(error);
  }
};

// DELETE MOVIE
exports.deleteMovie = async (req, res, next) => {
  const { id } = req.params;
  try {
    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    return res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    next(error);
  }
};
