import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from '@/types';

interface ProtectedRouteProps {
  user: User | null;
  isReady: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, isReady }) => {
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
