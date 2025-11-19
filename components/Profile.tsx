import { uploadToImgBB } from "../utils/uploadToImgBB";
import React, { useState, useRef } from 'react';
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import EditProfileModal from './EditProfileModal.tsx';

// ⭐ NEW IMPORTS
import { uploadToImgBB } from "../utils/uploadToImgBB"; 
import { auth, db } from "../firebaseConfig"; 
import { doc, updateDoc } from "firebase/firestore";

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedData: Partial<User>) => void;
}

const ProfileStat: React.FC<{ icon: string; value: string; label: string; color: string; }> = ({ icon, value, label, color }) => (
    <div className="flex items-center p-4 bg-white dark:bg-gray-700 border border-slate-100 dark:border-slate-600 rounded-xl group transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`p-3 rounded-full mr-4 ${color} transition-transform group-hover:animate-float`}>
            <Icon name={icon} className="w-6 h-6 text-white"/>
        </div>
        <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // ⭐ NEW STATE
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ⭐ NEW FUNCTION — open file picker
  const openFilePicker = () => fileInputRef.current?.click();

  // ⭐ NEW FUNCTION — handle avatar upload
  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload to ImgBB
      const imgUrl = await uploadToImgBB(file);

      // Update Firestore
      const current = auth.currentUser;
      if (!current) throw new Error("User not logged in");

      const userRef = doc(db, "users", current.uid);
      await updateDoc(userRef, { avatar: imgUrl });

      // Update UI
      setAvatarUrl(imgUrl);
      onProfileUpdate({ avatar: imgUrl });

      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Calculate level progress
  const pointsForCurrentLevel = (user.level - 1) * 1000;
  const pointsForNextLevel = user.level * 1000;
  const pointsInCurrentLevel = user.points - pointsForCurrentLevel;
  const pointsNeededForLevelUp = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForLevelUp) * 100));

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="relative">
              <div className="relative w-32 h-32">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full animate-pulse-bright opacity-50"></div>

                  {}
                  <img src={avatarUrl} alt={user.name} className="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 shadow-md" />
              </div>

              
              <button
                onClick={openFilePicker}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full hover:bg-brand-secondary transition-colors transform hover:scale-110 shadow-sm border-2 border-white dark:border-gray-800"
              >
                {uploading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
              </button>

              {/* ⭐ NEW HIDDEN INPUT */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="sm:ml-8 mt-4 sm:mt-0 flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-md text-gray-500 dark:text-gray-400 mt-1">{user.bio || `Level ${user.level} - Passionate Learner`}</p>

              <div className="mt-4">
                  <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">Level {user.level}</span>
                      <span className="font-semibold text-brand-primary">{pointsForNextLevel.toLocaleString()} pts to Level {user.level + 1}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
              </div>

              <button
                onClick={() => setEditModalOpen(true)}
                className="mt-4 px-6 py-2 bg-brand-light text-brand-primary dark:bg-gray-700 dark:text-brand-light font-semibold rounded-full hover:bg-purple-100 dark:hover:bg-gray-600 transition-colors transform hover:scale-105"
              >
                  Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* STATS — unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProfileStat icon="star" value={user.points.toLocaleString()} label="Total Points" color="bg-yellow-400" />
            <ProfileStat icon="flame" value={`${user.streak} Days`} label="Learning Streak" color="bg-red-500" />
            <ProfileStat icon="award" value={`${user.level}`} label="Current Level" color="bg-blue-500" />
            <ProfileStat icon="courses" value={`${user.ongoingCourses.length}`} label="Active Courses" color="bg-green-500" />
            <ProfileStat icon="check" value="8" label="Courses Completed" color="bg-purple-500" />
            <ProfileStat icon="leaderboard" value="#3" label="All-Time Rank" color="bg-indigo-500" />
        </div>

        {/* Achievements — unchanged */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Achievements & Badges</h3>
            <div className="flex flex-wrap gap-4">
                {['Scholar', 'Streak Master', 'Quick Learner', 'Top 10', 'Quantum Explorer', 'History Buff'].map(badge => (
                    <div key={badge} className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-28 text-center transition-transform transform hover:scale-110 hover:-rotate-6 duration-300 cursor-pointer">
                        <div className="p-3 bg-yellow-400 rounded-full mb-2">
                          <Icon name="award" className="w-6 h-6 text-white"/>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{badge}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          user={user} 
          onClose={() => setEditModalOpen(false)}
          onSave={onProfileUpdate}
        />
      )}
    </>
  );
};

export default Profile;
