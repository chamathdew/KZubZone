'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

export default function ManagementLayout({ children }) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/management/login';

  useEffect(() => {
    if (!loading && !isLoginPage) {
      const isAuthorized = admin || (user && user.hasDashboardAccess);
      if (!isAuthorized) {
        router.push('/auth');
      }
    }
  }, [loading, admin, user, isLoginPage, router]);

  if (!isLoginPage && (loading || (!admin && !(user && user.hasDashboardAccess)))) {
    return (
      <div className="h-screen w-screen bg-luxury-950 flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Admin Portal...</span>
      </div>
    );
  }

  return <>{children}</>;
}
