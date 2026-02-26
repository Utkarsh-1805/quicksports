'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/Spinner';

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login while saving the attempted url
        const searchParams = new URLSearchParams();
        searchParams.set('callbackUrl', pathname);
        router.push(`/auth/login?${searchParams.toString()}`);
      } else if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'FACILITY_OWNER') {
          router.push('/owner/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, loading, user, router, pathname, allowedRoles]);

  // Show full screen loader while checking authentication
  if (loading) {
    return <PageLoader message="Verifying access..." />;
  }

  // If not authenticated, or not authorized, don't render children
  // Let the useEffect handle the redirect
  if (!isAuthenticated || (allowedRoles.length > 0 && !allowedRoles.includes(user?.role))) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
