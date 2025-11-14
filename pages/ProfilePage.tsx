import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Profile from '@/components/Profile.tsx';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';

const ProfilePage: React.FC = () => {
  const { user, onProfileUpdate, coursesLoading } = useOutletContext<SidebarLayoutContext>();

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  return <Profile user={user} onProfileUpdate={onProfileUpdate} />;
};

export default ProfilePage;
