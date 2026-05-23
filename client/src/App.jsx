import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import Home from './pages/Home';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Auth from './pages/Auth';

// Protected User Pages
import Profile from './pages/Profile';

// Protected Admin Pages
import AdminLogin from './pages/management/AdminLogin';
import AdminDashboard from './pages/management/AdminDashboard';
import MovieManager from './pages/management/MovieManager';
import DramaManager from './pages/management/DramaManager';
import SubtitleManager from './pages/management/SubtitleManager';
import ReviewManager from './pages/management/ReviewManager';
import TmdbImport from './pages/management/TmdbImport';
import UserManager from './pages/management/UserManager';
import SeoManager from './pages/management/SeoManager';

// Layout structure
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Guard: Simple User Protected Route
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center text-brand-primary text-xl">Loading session...</div>;
  return user ? children : <Navigate to="/auth" />;
};

// Guard: Simple Admin Protected Route
const AdminRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center text-brand-primary text-xl">Loading administration...</div>;
  return admin ? children : <Navigate to="/management/login" />;
};

function AppContent() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-luxury-950 text-slate-100 selection:bg-brand-primary selection:text-white">
        <Navbar />
        <main className="flex-grow pb-16">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/movie/:slug" element={<Detail type="Movie" />} />
            <Route path="/drama/:slug" element={<Detail type="Drama" />} />
            <Route path="/drama/:slug/:seasonPart/:episodePart" element={<Watch />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auth" element={<Auth />} />

            {/* User Protected Routes */}
            <Route path="/profile" element={
              <UserRoute>
                <Profile />
              </UserRoute>
            } />

            {/* Admin Management System */}
            <Route path="/management/login" element={<AdminLogin />} />
            <Route path="/management/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/management/movies" element={
              <AdminRoute>
                <MovieManager />
              </AdminRoute>
            } />
            <Route path="/management/dramas" element={
              <AdminRoute>
                <DramaManager />
              </AdminRoute>
            } />
            <Route path="/management/subtitles" element={
              <AdminRoute>
                <SubtitleManager />
              </AdminRoute>
            } />
            <Route path="/management/comments" element={
              <AdminRoute>
                <ReviewManager />
              </AdminRoute>
            } />
            <Route path="/management/import" element={
              <AdminRoute>
                <TmdbImport />
              </AdminRoute>
            } />
            <Route path="/management/users" element={
              <AdminRoute>
                <UserManager />
              </AdminRoute>
            } />
            <Route path="/management/settings" element={
              <AdminRoute>
                <SeoManager />
              </AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
