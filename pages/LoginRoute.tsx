import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoginPage from '@/components/LoginPage.tsx';
import { User } from '@/types';

interface LoginRouteProps {
  user: User | null;
}

const LoginRoute: React.FC<LoginRouteProps> = ({ user }) => {
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage onNavigateHome={() => navigate('/')} />;
};

export default LoginRoute;
