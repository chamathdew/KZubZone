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
  const [restorationTimedOut, setRestorationTimedOut] = useState(false);

  const isLoginPage = pathname === '/management/login';

  // Wait for client-side hydration
  useEffect(() => {
    setHasMounted(true);
    // Safety timeout: if session hasn't restored in 4s, stop waiting
    const t = setTimeout(() => setRestorationTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasMounted || loading || isLoginPage) return;
    const isAuthorized = admin || (user && user.hasDashboardAccess);
    const hasAdminToken = !!tokenService.getAdminToken();
    if (!isAuthorized && !hasAdminToken) {
      router.push('/management/login');
    }
  }, [hasMounted, loading, admin, user, isLoginPage, router]);

  const hasAdminTokenInStorage = typeof window !== 'undefined' && !!tokenService.getAdminToken();
  const isAuthorized = admin || (user && user.hasDashboardAccess);
  // Only block with spinner if: not mounted, still loading auth, OR token exists but not yet resolved (but only up to timeout)
  const stillWaiting = !hasMounted || loading || (!isAuthorized && hasAdminTokenInStorage && !restorationTimedOut);

  if (!isLoginPage && stillWaiting) {
    return (
      <div className="h-screen w-screen bg-luxury-950 flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Admin Portal...</span>
      </div>
    );
  }

  return <>{children}</>;
}
