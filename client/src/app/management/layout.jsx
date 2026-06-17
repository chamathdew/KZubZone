'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { tokenService } from '@/services/api/tokenService';

export default function ManagementLayout({ children }) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  const isLoginPage = pathname === '/management/login';

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Redirect only when we're sure there's no valid session
  useEffect(() => {
    if (!hasMounted || loading || isLoginPage) return;
    const hasAdminToken = !!tokenService.getAdminToken();
    const isAuthorized = admin || (user && user.hasDashboardAccess);
    if (!isAuthorized && !hasAdminToken) {
      router.push('/management/login');
    }
  }, [hasMounted, loading, admin, user, isLoginPage, router]);

  // SSR guard
  if (!hasMounted) {
    return <div className="h-screen w-screen bg-luxury-950" />;
  }

  const hasAdminTokenInStorage = !!tokenService.getAdminToken();
  const isAuthorized = admin || (user && user.hasDashboardAccess);

  // Only block if genuinely no token at all
  if (!isLoginPage && !hasAdminTokenInStorage && !isAuthorized) {
    return (
      <div className="h-screen w-screen bg-luxury-950 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Slim progress bar while auth verifies in background */}
      {!isLoginPage && loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 overflow-hidden bg-brand-primary/20">
          <div className="h-full bg-brand-primary" style={{ animation: 'adminBar 1.2s ease-in-out infinite' }} />
        </div>
      )}
      {/* Instant render — no opacity delay */}
      <div className="animate-fadeInAdmin">
        {children}
      </div>
      <style>{`
        @keyframes adminBar {
          0% { transform: translateX(-100%) scaleX(0.4); }
          60% { transform: translateX(60%) scaleX(0.6); }
          100% { transform: translateX(200%) scaleX(0.4); }
        }
        @keyframes fadeInAdmin {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fadeInAdmin {
          animation: fadeInAdmin 0.15s ease-out forwards;
        }
      `}</style>
    </>
  );
}
