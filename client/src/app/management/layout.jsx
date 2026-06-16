'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { tokenService } from '@/services/api/tokenService';

export default function ManagementLayout({ children }) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const isLoginPage = pathname === '/management/login';

  useEffect(() => {
    setHasMounted(true);
    // Trigger fade-in after mount
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Redirect if no token and auth is confirmed loaded (not just slow)
  useEffect(() => {
    if (!hasMounted || loading || isLoginPage) return;
    const hasAdminToken = !!tokenService.getAdminToken();
    const isAuthorized = admin || (user && user.hasDashboardAccess);
    if (!isAuthorized && !hasAdminToken) {
      router.push('/management/login');
    }
  }, [hasMounted, loading, admin, user, isLoginPage, router]);

  // SSR safe — check token presence on client only
  const hasAdminTokenInStorage = hasMounted && !!tokenService.getAdminToken();
  const isAuthorized = admin || (user && user.hasDashboardAccess);

  // Only block with blank screen if:
  // 1. Not mounted yet (SSR hydration - unavoidable flash prevention)
  // 2. Definitely no token AND not on login page
  if (!hasMounted) {
    // Invisible placeholder — prevents SSR hydration mismatch
    return (
      <div className="h-screen w-screen bg-luxury-950" />
    );
  }

  if (!isLoginPage && !hasAdminTokenInStorage && !isAuthorized) {
    // No token at all, redirect (this is quick)
    return (
      <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Slim top loading bar shown while auth is in-flight */}
      {!isLoginPage && loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-brand-primary/30 overflow-hidden">
          <div className="h-full bg-brand-primary animate-[slide_1.5s_ease-in-out_infinite]"
               style={{ width: '40%', animation: 'adminProgress 1.5s ease-in-out infinite' }} />
        </div>
      )}
      <div
        className="transition-opacity duration-300 ease-out"
        style={{ opacity: fadeIn ? 1 : 0 }}
      >
        {children}
      </div>
      <style>{`
        @keyframes adminProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </>
  );
}
