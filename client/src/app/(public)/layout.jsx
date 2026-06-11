'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import ScrollToTop from '@/components/ui/ScrollToTop';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/features/auth/hooks/useAuth';
import MaintenanceMode from '@/components/layout/MaintenanceMode';

export default function PublicLayout({ children }) {
  const { content, loading: contentLoading } = useSiteContent();
  const { admin, loading: authLoading } = useAuth();

  if (contentLoading || authLoading) {
    return (
      <div className="min-h-screen bg-luxury-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (content?.system?.maintenanceMode && !admin) {
    return (
      <MaintenanceMode 
        message={content?.system?.maintenanceMessage}
        siteName={content?.brand?.siteName}
        contactEmail={content?.footer?.email}
      />
    );
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow pb-16">
        {children}
      </main>

      <Footer />
    </>
  );
}
