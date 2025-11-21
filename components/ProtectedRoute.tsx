import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from '@/types';

interface ProtectedRouteProps {
  user: User | null;
  authReady: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, authReady }) => {
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
