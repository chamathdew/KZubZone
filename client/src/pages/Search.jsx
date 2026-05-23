import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import GlassCard from '../components/GlassCard';
import SeoTags from '../components/SeoTags';
import { Search as SearchIcon, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialQuery = searchParams.get('q') || '';
  const [searchText, setSearchText] = useState(initialQuery);
  const [category, setCategory] = useState('drama'); // drama or movie
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('');
  const [rating, setRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Sync state if query param changes externally
  useEffect(() => {
    setSearchText(initialQuery);
  }, [initialQuery]);

  // Fetch search results
  const fetchUrl = category === 'movie' ? '/api/media/movies' : '/api/media/dramas';
  const { data, isLoading } = useQuery({
    queryKey: ['searchResults', category, searchText, genre, year, country, rating, sortBy, page],
    queryFn: async () => {
      // Trigger search query logging (analytics) via backend when search starts
      if (searchText.trim().length > 1) {
        axios.post('/api/analytics/search', { query: searchText.trim() }).catch(() => {});
      }

      const res = await axios.get(fetchUrl, {
        params: {
          search: searchText || undefined,
          genre: genre || undefined,
          year: year || undefined,
          country: country || undefined,
          rating: rating || undefined,
          sort: sortBy,
          page,
          limit: 12
        }
      });
      return res.data;
    }
  });

  const items = category === 'movie' ? data?.movies || [] : data?.dramas || [];
  const totalPages = data?.totalPages || 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchText ? { q: searchText } : {});
    setPage(1);
  };

  const handleReset = () => {
    setSearchText('');
    setGenre('');
    setYear('');
    setCountry('');
    setRating('');
    setSortBy('newest');
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left flex flex-col gap-8 min-h-screen">
      
      <SeoTags
        title="Advanced Search - KDramaVerse Catalog"
        description="Search through hundreds of Korean dramas, movies, and subtitles. Filter by genre, rating, release year, or language."
        keywords={['search kdramas', 'korean movies filter', 'kdramaverse catalog']}
      />

      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-primary" /> Advanced Catalog Search
        </h1>
        <p className="text-xs text-slate-400 mt-1">Explore our deep library of Korean cinematic releases and series.</p>
      </div>

      {/* Search inputs */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl flex gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Type keyword, title, cast names, description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl text-xs sm:text-sm glass-input focus:bg-luxury-900 focus:border-brand-primary"
          />
          <SearchIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
        </div>
        <button
          type="submit"
          className="h-11 px-5 bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg"
        >
          Search
        </button>
      </form>

      {/* Search Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar Filters */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </h3>
            <button type="button" onClick={handleReset} className="text-[10px] font-bold text-brand-secondary hover:underline">
              Clear All
            </button>
          </div>

          <hr className="border-white/5" />

          {/* Category Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Category</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCategory('drama'); setPage(1); }}
                className={`flex-1 h-9 rounded-xl text-xs font-bold transition ${category === 'drama' ? 'bg-brand-primary text-white' : 'bg-white/5 border border-white/5 text-slate-400'}`}
              >
                K-Dramas
              </button>
              <button
                type="button"
                onClick={() => { setCategory('movie'); setPage(1); }}
                className={`flex-1 h-9 rounded-xl text-xs font-bold transition ${category === 'movie' ? 'bg-brand-primary text-white' : 'bg-white/5 border border-white/5 text-slate-400'}`}
              >
                Movies
              </button>
            </div>
          </div>

          {/* Genre input */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Genre</label>
            <input
              type="text"
              placeholder="e.g. Action, Horror, Romance"
              value={genre}
              onChange={(e) => { setGenre(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Year selector */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Release Year</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2020">2020s</option>
              <option value="2016">2016</option>
            </select>
          </div>

          {/* Country selector */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Origin Country</label>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none"
            >
              <option value="">All Countries</option>
              <option value="KR">South Korea</option>
              <option value="JP">Japan</option>
              <option value="CN">China</option>
              <option value="US">USA</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none"
            >
              <option value="newest">Newest Released</option>
              <option value="oldest">Oldest Released</option>
              <option value="rating">Highest Rated (TMDB)</option>
              <option value="views">Most Viewed</option>
              <option value="az">A-Z</option>
            </select>
          </div>

        </div>

        {/* Results grid */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-luxury-800 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center text-slate-400">
              <p className="text-sm font-bold">No results match your search.</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item) => (
                  <GlassCard key={item._id} item={item} type={category} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 h-8 bg-white/5 border border-white/10 disabled:bg-transparent disabled:text-slate-600 disabled:border-white/5 rounded-xl text-xs font-bold text-white transition"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-400 font-semibold px-2">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 h-8 bg-white/5 border border-white/10 disabled:bg-transparent disabled:text-slate-600 disabled:border-white/5 rounded-xl text-xs font-bold text-white transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
}
