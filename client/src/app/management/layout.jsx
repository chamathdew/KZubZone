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

  // Wait for client-side hydration before evaluating auth
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || loading || isLoginPage) return;

    const isAuthorized = admin || (user && user.hasDashboardAccess);
    // Only redirect if there's also no token in storage (not just a slow network)
    const hasAdminToken = !!tokenService.getAdminToken();

    if (!isAuthorized && !hasAdminToken) {
      router.push('/management/login');
    }
  }, [hasMounted, loading, admin, user, isLoginPage, router]);

  // Show spinner while: not mounted yet, still loading, OR token exists but admin state not restored yet
  const hasAdminTokenInStorage = typeof window !== 'undefined' && !!tokenService.getAdminToken();
  const stillRestoringSession = !loading && hasAdminTokenInStorage && !admin && !(user && user.hasDashboardAccess);

  if (!isLoginPage && (!hasMounted || loading || stillRestoringSession)) {
    return (
      <div className="h-screen w-screen bg-luxury-950 flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Admin Portal...</span>
      </div>
    );
  }

  return <>{children}</>;
}
