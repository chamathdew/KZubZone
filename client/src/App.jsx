import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { SiteContentProvider, SiteContentContext } from './context/SiteContentContext';
import { useSiteContent } from './hooks/useSiteContent';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Public Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/public/Home'));
const Detail = lazy(() => import('./pages/public/Detail'));
const Watch = lazy(() => import('./pages/public/Watch'));
const Search = lazy(() => import('./pages/public/Search'));
const Auth = lazy(() => import('./pages/public/Auth'));
const Articles = lazy(() => import('./pages/public/Articles'));
const ArticleDetail = lazy(() => import('./pages/public/ArticleDetail'));

// Protected User Pages (Lazy Loaded)
const Profile = lazy(() => import('./pages/protected/Profile'));

// Protected Admin Pages (Lazy Loaded)
const AdminLogin = lazy(() => import('./pages/management/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/management/AdminDashboard'));
const MovieManager = lazy(() => import('./pages/management/MovieManager'));
const DramaManager = lazy(() => import('./pages/management/DramaManager'));
const SubtitleManager = lazy(() => import('./pages/management/SubtitleManager'));
const SubtitleTools = lazy(() => import('./pages/management/SubtitleTools'));
const ReviewManager = lazy(() => import('./pages/management/ReviewManager'));
const TmdbImport = lazy(() => import('./pages/management/TmdbImport'));
const UserManager = lazy(() => import('./pages/management/UserManager'));
const SeoManager = lazy(() => import('./pages/management/SeoManager'));
const ArticleManager = lazy(() => import('./pages/management/ArticleManager'));
const SiteManager = lazy(() => import('./pages/management/SiteManager'));
const DatabaseViewer = lazy(() => import('./pages/management/DatabaseViewer'));

// Layout & Global Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import AIChatWidget from './components/widgets/AIChatWidget';
import ParticleBackground from './components/layout/ParticleBackground';

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
  if (loading) return <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center text-brand-primary text-xl font-black uppercase tracking-wider">Loading Session...</div>;
  return user ? children : <Navigate to="/auth" />;
};

// Guard: Simple Admin Protected Route
const AdminRoute = ({ children }) => {
  const { user, admin, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center text-brand-primary text-xl font-black uppercase tracking-wider">Loading Admin...</div>;
  if (admin) return children;
  if (user && user.hasDashboardAccess) return children;
  return <Navigate to="/auth" />;
};

const PageSpinner = () => (
  <div className="h-screen w-screen bg-luxury-950 flex flex-col items-center justify-center gap-3 select-none">
    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Portal...</span>
  </div>
);

function AppRoutes() {
  const location = useLocation();
  const isManagementRoute = location.pathname.startsWith('/management');
  const { content } = useSiteContent();

  return (
    <>
      <ScrollToTop />
      <div className={`flex flex-col min-h-screen bg-luxury-950 text-slate-100 selection:bg-brand-primary selection:text-white relative ${isManagementRoute ? 'overflow-x-hidden' : ''}`}>
        <ParticleBackground />
        
        {/* Rest of the app content needs relative positioning to stay above the absolute/fixed particles */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {!isManagementRoute && <Navbar />}
          <main className={isManagementRoute ? 'flex-grow' : 'flex-grow pb-16'}>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/movie/:slug" element={<Detail type="Movie" />} />
                <Route path="/drama/:slug" element={<Detail type="Drama" />} />
                <Route path="/drama/:slug/:seasonPart/:episodePart" element={<Watch />} />
                <Route path="/search" element={<Search />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
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
                <Route path="/management/articles" element={
                  <AdminRoute>
                    <ArticleManager />
                  </AdminRoute>
                } />
                <Route path="/management/subtitles" element={
                  <AdminRoute>
                    <SubtitleManager />
                  </AdminRoute>
                } />
                <Route path="/management/subtitle-tools" element={
                  <AdminRoute>
                    <SubtitleTools />
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
                    <SiteManager />
                  </AdminRoute>
                } />
                <Route path="/management/database" element={
                  <AdminRoute>
                    <DatabaseViewer />
                  </AdminRoute>
                } />
                <Route path="/management/seo" element={
                  <AdminRoute>
                    <SeoManager />
                  </AdminRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </main>
          {!isManagementRoute && content.ai?.enableChatbot !== false && <AIChatWidget />}
          {!isManagementRoute && <Footer />}
        </div>
      </div>
    </>
  );
}

function AppContent() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SiteContentProvider>
            <AppContent />
          </SiteContentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
