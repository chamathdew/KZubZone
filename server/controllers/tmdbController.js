const axios = require('axios');
const Movie = require('../models/Movie');
const Drama = require('../models/Drama');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Genre = require('../models/Genre');
const Setting = require('../models/Setting');
const aiSeoController = require('./aiSeoController');

// Sample mock data for popular K-Dramas & K-Movies
const MOCK_TMDB_DATA = {
  movies: [
    {
      id: 555501,
      title: "Train to Busan",
      original_title: "부산행",
      overview: "A zombie virus breaks out in South Korea, and passengers on a train from Seoul to Busan struggle to survive the outbreak.",
      genres: [{ id: 27, name: "Horror" }, { id: 28, name: "Action" }, { id: 53, name: "Thriller" }],
      poster_path: "/v5195.jpg", // We will use placeholder paths or actual TMDB paths
      backdrop_path: "/b195.jpg",
      release_date: "2016-07-20",
      runtime: 118,
      origin_country: ["KR"],
      original_language: "ko",
      production_companies: [{ name: "RedPeter Films" }, { name: "Next Entertainment World" }],
      vote_average: 8.0,
      keywords: ["zombie", "survival", "train", "father daughter relationship"],
      trailer: "https://www.youtube.com/embed/pyWuHv2-Y8s",
      director: "Yeon Sang-ho",
      writers: ["Park Joo-suk", "Yeon Sang-ho"],
      cast: [
        { name: "Gong Yoo", character: "Seok-woo", profilePath: "/gongyoo.jpg" },
        { name: "Ma Dong-seok", character: "Sang-hwa", profilePath: "/madongseok.jpg" },
        { name: "Jung Yu-mi", character: "Seong-kyeong", profilePath: "/jungyumi.jpg" }
      ],
      crew: [{ name: "Yeon Sang-ho", job: "Director" }],
      images: ["/busan_1.jpg", "/busan_2.jpg"],
      studio: "RedPeter Films"
    },
    {
      id: 555502,
      title: "Parasite",
      original_title: "기생충",
      overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
      genres: [{ id: 35, name: "Comedy" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
      poster_path: "/parasite_poster.jpg",
      backdrop_path: "/parasite_back.jpg",
      release_date: "2019-05-30",
      runtime: 132,
      origin_country: ["KR"],
      original_language: "ko",
      production_companies: [{ name: "Barunson E&A" }],
      vote_average: 8.5,
      keywords: ["social commentary", "class conflict", "dark comedy", "scam"],
      trailer: "https://www.youtube.com/embed/5xH0HfJHsaY",
      director: "Bong Joon-ho",
      writers: ["Bong Joon-ho", "Han Jin-won"],
      cast: [
        { name: "Song Kang-ho", character: "Ki-taek", profilePath: "/songkangho.jpg" },
        { name: "Lee Sun-kyun", character: "Mr. Park", profilePath: "/leesunkyun.jpg" },
        { name: "Cho Yeo-jeong", character: "Mrs. Park", profilePath: "/choyeojeong.jpg" }
      ],
      crew: [{ name: "Bong Joon-ho", job: "Director" }],
      images: ["/parasite_1.jpg", "/parasite_2.jpg"],
      studio: "Barunson E&A"
    }
  ],
  dramas: [
    {
      id: 999901,
      name: "Moving",
      original_name: "무빙",
      overview: "Children with superpowers and their parents who harbor painful secrets from the past face a massive imminent danger together.",
      genres: [{ id: 10759, name: "Action & Adventure" }, { id: 18, name: "Drama" }, { id: 9648, name: "Mystery" }],
      poster_path: "/moving_poster.jpg",
      backdrop_path: "/moving_back.jpg",
      first_air_date: "2023-08-09",
      episode_run_time: [45],
      origin_country: ["KR"],
      original_language: "ko",
      production_companies: [{ name: "Studio Flow" }, { name: "Mr. Romance" }],
      vote_average: 8.4,
      keywords: ["superpowers", "secret agent", "family", "high school"],
      trailer: "https://www.youtube.com/embed/rP1Zc5b_a6E",
      director: "Park In-je",
      writers: ["Kang Full"],
      cast: [
        { name: "Ryu Seung-ryong", character: "Jang Ju-won", profilePath: "/ryu.jpg" },
        { name: "Han Hyo-joo", character: "Lee Mi-hyun", profilePath: "/han.jpg" },
        { name: "Zo In-sung", character: "Kim Doo-shik", profilePath: "/zo.jpg" },
        { name: "Lee Jung-ha", character: "Kim Bong-seok", profilePath: "/leejungha.jpg" }
      ],
      crew: [{ name: "Park In-je", job: "Director" }],
      images: ["/moving_1.jpg", "/moving_2.jpg"],
      studio: "Studio Flow",
      seasons: [
        {
          season_number: 1,
          overview: "Season 1 chronicles the awakening of high schoolers' abilities and the agents guarding them.",
          poster_path: "/moving_s1_poster.jpg",
          air_date: "2023-08-09",
          episodes: [
            { episode_number: 1, name: "Superpower Senior", overview: "Bong-seok hides his ability to float. A new girl, Hui-soo, transfers to his school.", air_date: "2023-08-09", runtime: 45 },
            { episode_number: 2, name: "Han River Euljiro", overview: "A mysterious assassin named Frank begins targeting retired agents with superpowers.", air_date: "2023-08-09", runtime: 48 },
            { episode_number: 3, name: "Secret Partner", overview: "Gang-hoon keeps his speed and strength secret while monitoring Hui-soo and Bong-seok.", air_date: "2023-08-09", runtime: 50 }
          ]
        }
      ]
    },
    {
      id: 999902,
      name: "Goblin",
      original_name: "쓸쓸하고 찬란하神-도깨비",
      overview: "An immortal goblin needs a human bride to end his life. He crosses paths with a grim reaper and a girl who claims she is the goblin's bride.",
      genres: [{ id: 18, name: "Drama" }, { id: 10765, name: "Sci-Fi & Fantasy" }],
      poster_path: "/goblin_poster.jpg",
      backdrop_path: "/goblin_back.jpg",
      first_air_date: "2016-12-02",
      episode_run_time: [75],
      origin_country: ["KR"],
      original_language: "ko",
      production_companies: [{ name: "Studio Dragon" }],
      vote_average: 8.7,
      keywords: ["goblin", "grim reaper", "reincarnation", "immortality", "romance"],
      trailer: "https://www.youtube.com/embed/8AcQ-5Fv6Qc",
      director: "Lee Eung-bok",
      writers: ["Kim Eun-sook"],
      cast: [
        { name: "Gong Yoo", character: "Kim Shin (Goblin)", profilePath: "/gongyoo.jpg" },
        { name: "Kim Go-eun", character: "Ji Eun-tak", profilePath: "/kimgoeun.jpg" },
        { name: "Lee Dong-wook", character: "Grim Reaper", profilePath: "/leedongwook.jpg" }
      ],
      crew: [{ name: "Lee Eung-bok", job: "Director" }],
      images: ["/goblin_1.jpg", "/goblin_2.jpg"],
      studio: "Studio Dragon",
      seasons: [
        {
          season_number: 1,
          overview: "Follow the romantic and tragic tale of goblin Kim Shin and Eun-tak.",
          poster_path: "/goblin_s1_poster.jpg",
          air_date: "2016-12-02",
          episodes: [
            { episode_number: 1, name: "The Goblin's Bride", overview: "Kim Shin, cursed with immortality, wanders the Earth. Eun-tak summons him accidentally.", air_date: "2016-12-02", runtime: 75 },
            { episode_number: 2, name: "A Strange Coexistence", overview: "Shin and the Grim Reaper live under one roof and find Eun-tak is kidnapped.", air_date: "2016-12-09", runtime: 73 }
          ]
        }
      ]
    }
  ]
};

const looksLikeTmdbKey = (value) => (
  typeof value === 'string' &&
  /^[a-f0-9]{20,}$/i.test(value.trim())
);

const getTmdbApiKey = async () => {
  if (process.env.TMDB_API_KEY) {
    return process.env.TMDB_API_KEY.trim();
  }

  const directSetting = await Setting.findOne({
    key: { $in: ['TMDB_API_KEY', 'tmdb_api_key', 'tmdb', 'TMDB', 'Tmdb'] }
  }).lean();

  if (directSetting?.value && typeof directSetting.value === 'string') {
    return directSetting.value.trim();
  }

  // Support the common admin-form mistake where the API key is entered as
  // the setting key and "Tmdb" is entered as the value.
  const reversedSetting = await Setting.findOne({
    value: /^tmdb$/i
  }).lean();

  if (looksLikeTmdbKey(reversedSetting?.key)) {
    return reversedSetting.key.trim();
  }

  return '';
};

// Helper: Format movie schema after fetching details
const processMovieData = async (data) => {
  const genresList = data.genres ? data.genres.map(g => g.name) : [];
  
  // Register genres in our DB
  for (const g of (data.genres || [])) {
    await Genre.findOneAndUpdate(
      { name: g.name },
      { name: g.name, slug: g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), tmdbId: g.id },
      { upsert: true }
    );
  }

  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

  const movieDoc = {
    title: data.title,
    originalTitle: data.original_title || data.title,
    slug: slug,
    description: data.overview,
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://placehold.co/500x750/111/fff?text=No+Poster',
    banner: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : 'https://placehold.co/1920x1080/111/fff?text=No+Banner',
    backdrops: data.backdrop_path ? [`https://image.tmdb.org/t/p/original${data.backdrop_path}`] : [],
    releaseDate: data.release_date ? new Date(data.release_date) : null,
    runtime: data.runtime || 120,
    country: data.origin_country && data.origin_country[0] ? data.origin_country[0] : 'KR',
    language: data.original_language || 'ko',
    productionCompanies: data.production_companies ? data.production_companies.map(c => c.name) : [],
    tmdbRating: data.vote_average || 0,
    imdbRating: data.vote_average || 0, // Fallback to TMDB
    trailer: data.trailer || '',
    keywords: data.keywords || [],
    images: data.images || [],
    director: data.director || (data.credits && data.credits.crew ? data.credits.crew.find(c => c.job === 'Director')?.name : 'Unknown'),
    writers: data.writers || (data.credits && data.credits.crew ? data.credits.crew.filter(c => c.department === 'Writing').map(c => c.name) : []),
    studio: data.studio || (data.production_companies && data.production_companies[0]?.name) || 'Unknown Studio',
    cast: data.cast || (data.credits && data.credits.cast ? data.credits.cast.slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ''
    })) : []),
    crew: data.crew || (data.credits && data.credits.crew ? data.credits.crew.slice(0, 10).map(c => ({
      name: c.name,
      job: c.job,
      department: c.department
    })) : []),
    tmdbId: data.id,
    status: 'Published'
  };

  // Run AI SEO Content Generation automatically after formatting
  const generatedSeo = aiSeoController.generateSeoForTitle(movieDoc.title, movieDoc.description, 'Movie', {
    genres: genresList,
    releaseDate: movieDoc.releaseDate,
    director: movieDoc.director,
    cast: movieDoc.cast.map(c => c.name)
  });

  Object.assign(movieDoc, generatedSeo);

  // Save to DB
  return await Movie.findOneAndUpdate({ tmdbId: data.id }, movieDoc, { upsert: true, new: true });
};

// Helper: Format TV/Drama schema after fetching details
const processDramaData = async (data) => {
  const genresList = data.genres ? data.genres.map(g => g.name) : [];
  
  // Register genres in our DB
  for (const g of (data.genres || [])) {
    await Genre.findOneAndUpdate(
      { name: g.name },
      { name: g.name, slug: g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), tmdbId: g.id },
      { upsert: true }
    );
  }

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

  const dramaDoc = {
    title: data.name,
    originalTitle: data.original_name || data.name,
    slug: slug,
    description: data.overview,
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://placehold.co/500x750/111/fff?text=No+Poster',
    banner: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : 'https://placehold.co/1920x1080/111/fff?text=No+Banner',
    backdrops: data.backdrop_path ? [`https://image.tmdb.org/t/p/original${data.backdrop_path}`] : [],
    releaseDate: data.first_air_date ? new Date(data.first_air_date) : null,
    runtime: data.episode_run_time && data.episode_run_time[0] ? data.episode_run_time[0] : 60,
    country: data.origin_country && data.origin_country[0] ? data.origin_country[0] : 'KR',
    language: data.original_language || 'ko',
    productionCompanies: data.production_companies ? data.production_companies.map(c => c.name) : [],
    tmdbRating: data.vote_average || 0,
    imdbRating: data.vote_average || 0,
    trailer: data.trailer || '',
    keywords: data.keywords || [],
    images: data.images || [],
    director: data.director || (data.credits && data.credits.crew ? data.credits.crew.find(c => c.job === 'Director')?.name : 'Unknown'),
    writers: data.writers || (data.credits && data.credits.crew ? data.credits.crew.filter(c => c.department === 'Writing').map(c => c.name) : []),
    studio: data.studio || (data.production_companies && data.production_companies[0]?.name) || 'Unknown Studio',
    cast: data.cast || (data.credits && data.credits.cast ? data.credits.cast.slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ''
    })) : []),
    crew: data.crew || (data.credits && data.credits.crew ? data.credits.crew.slice(0, 10).map(c => ({
      name: c.name,
      job: c.job,
      department: c.department
    })) : []),
    tmdbId: data.id,
    status: 'Published'
  };

  // Run AI SEO Content Generation
  const generatedSeo = aiSeoController.generateSeoForTitle(dramaDoc.title, dramaDoc.description, 'Drama', {
    genres: genresList,
    releaseDate: dramaDoc.releaseDate,
    director: dramaDoc.director,
    cast: dramaDoc.cast.map(c => c.name)
  });

  Object.assign(dramaDoc, generatedSeo);

  // Save Drama to DB
  const drama = await Drama.findOneAndUpdate({ tmdbId: data.id }, dramaDoc, { upsert: true, new: true });

  // Handle Seasons & Episodes import
  if (data.seasons && data.seasons.length > 0) {
    for (const s of data.seasons) {
      const seasonDoc = {
        dramaId: drama._id,
        seasonNumber: s.season_number,
        seasonDescription: s.overview || `Season ${s.season_number} of ${drama.title}`,
        seasonPoster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : drama.poster,
        airDate: s.air_date ? new Date(s.air_date) : null
      };

      const season = await Season.findOneAndUpdate(
        { dramaId: drama._id, seasonNumber: s.season_number },
        seasonDoc,
        { upsert: true, new: true }
      );

      // Create episodes
      if (s.episodes && s.episodes.length > 0) {
        for (const ep of s.episodes) {
          // Schema markup for individual episodes
          const epSchema = {
            "@context": "https://schema.org",
            "@type": "TVEpisode",
            "name": ep.name,
            "episodeNumber": ep.episode_number,
            "description": ep.overview || `Episode ${ep.episode_number} of ${drama.title} Season ${s.season_number}`,
            "datePublished": ep.air_date || null
          };

          const episodeDoc = {
            dramaId: drama._id,
            seasonId: season._id,
            episodeNumber: ep.episode_number,
            episodeTitle: ep.name || `Episode ${ep.episode_number}`,
            episodeDescription: ep.overview || `Episode ${ep.episode_number} of Season ${s.season_number}`,
            episodeThumbnail: drama.banner, // Fallback to drama banner
            airDate: ep.air_date ? new Date(ep.air_date) : null,
            runtime: ep.runtime || drama.runtime,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Demo sample video
            aiEpisodeSummary: `AI generated recap for ${drama.title} Episode ${ep.episode_number}: ${ep.overview || ''}`,
            episodeSchemaMarkup: epSchema
          };

          await Episode.findOneAndUpdate(
            { seasonId: season._id, episodeNumber: ep.episode_number },
            episodeDoc,
            { upsert: true }
          );
        }
      }
    }
  }

  return drama;
};

// SEARCH CONTROLLER
exports.searchTmdb = async (req, res, next) => {
  const { query, type } = req.query; // type: 'movie' or 'tv'

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const TMDB_API_KEY = await getTmdbApiKey();

    if (TMDB_API_KEY) {
      // Direct API calling
      const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
      const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: 'en-US'
        }
      });

      const results = response.data.results.map(item => ({
        ...item,
        title: item.title || item.name,
        original_title: item.original_title || item.original_name,
        release_date: item.release_date || item.first_air_date
      }));

      return res.status(200).json(results);
    } else {
      // Mock Fallback
      console.log('TMDB API Key missing. Using simulated search results.');
      const dataStore = type === 'tv' ? MOCK_TMDB_DATA.dramas : MOCK_TMDB_DATA.movies;
      
      const filtered = dataStore.filter(item => {
        const titleText = (item.title || item.name || '').toLowerCase();
        const origText = (item.original_title || item.original_name || '').toLowerCase();
        return titleText.includes(query.toLowerCase()) || origText.includes(query.toLowerCase());
      });

      // Map to standardized search results
      const results = filtered.map(item => ({
        id: item.id,
        title: item.title || item.name,
        original_title: item.original_title || item.original_name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
        isMock: true
      }));

      return res.status(200).json(results);
    }
  } catch (error) {
    next(error);
  }
};

// IMPORT CONTROLLER
exports.importFromTmdb = async (req, res, next) => {
  const { id, type } = req.body; // type: 'movie' or 'tv'

  if (!id) {
    return res.status(400).json({ message: 'TMDB ID is required' });
  }

  try {
    const TMDB_API_KEY = await getTmdbApiKey();

    if (TMDB_API_KEY) {
      const endpoint = type === 'tv' ? 'tv' : 'movie';
      const detailRes = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits,videos,images,keywords'
        }
      });
      const data = detailRes.data;

      // Extract keywords
      let keywordsArr = [];
      if (data.keywords && data.keywords.keywords) {
        keywordsArr = data.keywords.keywords.map(k => k.name);
      } else if (data.keywords && data.keywords.results) {
        keywordsArr = data.keywords.results.map(k => k.name);
      }
      data.keywords = keywordsArr;

      // Extract trailer URL
      let trailerUrl = '';
      if (data.videos && data.videos.results) {
        const trailerObj = data.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailerObj) {
          trailerUrl = `https://www.youtube.com/embed/${trailerObj.key}`;
        }
      }
      data.trailer = trailerUrl;

      // Extract images array
      let imgArr = [];
      if (data.images && data.images.backdrops) {
        imgArr = data.images.backdrops.slice(0, 5).map(i => `https://image.tmdb.org/t/p/original${i.file_path}`);
      }
      data.images = imgArr;

      if (type === 'tv') {
        // Fetch seasons details with episode lists
        const seasonsFull = [];
        for (const s of (data.seasons || [])) {
          if (s.season_number === 0) continue; // Skip specials
          try {
            const seasonRes = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${s.season_number}`, {
              params: { api_key: TMDB_API_KEY }
            });
            seasonsFull.push(seasonRes.data);
          } catch (err) {
            console.error(`Error fetching season ${s.season_number}:`, err.message);
          }
        }
        data.seasons = seasonsFull;
        const importedDrama = await processDramaData(data);
        return res.status(201).json({ message: 'Drama imported successfully', media: importedDrama });
      } else {
        const importedMovie = await processMovieData(data);
        return res.status(201).json({ message: 'Movie imported successfully', media: importedMovie });
      }
    } else {
      // Mock Fallback importer
      console.log('TMDB API Key missing. Executing mock import mapping.');
      const dataStore = type === 'tv' ? MOCK_TMDB_DATA.dramas : MOCK_TMDB_DATA.movies;
      const data = dataStore.find(item => item.id === Number(id));

      if (!data) {
        return res.status(404).json({ message: 'Mock title details not found in fallback database.' });
      }

      if (type === 'tv') {
        const importedDrama = await processDramaData(data);
        return res.status(201).json({ message: 'Drama imported successfully (MOCK)', media: importedDrama });
      } else {
        const importedMovie = await processMovieData(data);
        return res.status(201).json({ message: 'Movie imported successfully (MOCK)', media: importedMovie });
      }
    }
  } catch (error) {
    next(error);
  }
};
