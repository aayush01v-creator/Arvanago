import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import EditProfileModal from './EditProfileModal.tsx';
import { uploadToImgBB } from "../utils/uploadToImgBB";
import { auth, db } from "../services/firebase";

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
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropScale, setCropScale] = useState(1.12);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Photo updated");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameSize = 280;

  const openFilePicker = () => fileInputRef.current?.click();

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setSelectedImage(objectUrl);
    setCropScale(1.12);
    setCropOffset({ x: 0, y: 0 });
    setCropModalOpen(true);
    setDragStart(null);
    if (e.target) e.target.value = "";
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  };

  const baseScale = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return 1;
    return Math.max(frameSize / imageSize.width, frameSize / imageSize.height);
  }, [frameSize, imageSize.height, imageSize.width]);

  const displayedScale = baseScale * cropScale;

  const cropImage = async () => {
    if (!selectedImage) return null;
    const image = new Image();
    image.src = selectedImage;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load image"));
    });

    const canvas = document.createElement('canvas');
    canvas.width = frameSize;
    canvas.height = frameSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const drawnWidth = image.width * displayedScale;
    const drawnHeight = image.height * displayedScale;
    const originX = frameSize / 2 + cropOffset.x - drawnWidth / 2;
    const originY = frameSize / 2 + cropOffset.y - drawnHeight / 2;

    const sourceX = Math.max(0, -originX / displayedScale);
    const sourceY = Math.max(0, -originY / displayedScale);
    const sourceWidth = Math.min(frameSize / displayedScale, image.width - sourceX);
    const sourceHeight = Math.min(frameSize / displayedScale, image.height - sourceY);

    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, frameSize, frameSize);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const filename = pendingFile?.name?.replace(/\.[^.]+$/, '') || 'avatar';
        resolve(new File([blob], `${filename}-cropped.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  };

  const handleCropAndUpload = async () => {
    if (!selectedImage) return;
    setUploading(true);

    try {
      const croppedFile = await cropImage();
      if (!croppedFile) throw new Error("Could not crop image");

      const imgUrl = await uploadToImgBB(croppedFile);

      const current = auth.currentUser;
      if (!current) throw new Error("User not logged in");

      const userRef = doc(db, "users", current.uid);
      await updateDoc(userRef, { avatar: imgUrl });

      setAvatarUrl(imgUrl);
      onProfileUpdate({ avatar: imgUrl });
      setToastMessage("Photo updated");
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update photo");
      setShowToast(true);
    } finally {
      setCropModalOpen(false);
      setUploading(false);
      setPendingFile(null);
      setSelectedImage(null);
    }
  };

  const handleDragStart: React.MouseEventHandler<HTMLDivElement> = (event) => {
    setDragStart({ x: event.clientX - cropOffset.x, y: event.clientY - cropOffset.y });
  };

  const handleDragMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!dragStart) return;
    setCropOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
  };

  const stopDragging = () => setDragStart(null);

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const touch = event.touches[0];
    setDragStart({ x: touch.clientX - cropOffset.x, y: touch.clientY - cropOffset.y });
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!dragStart) return;
    const touch = event.touches[0];
    setCropOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const resetCrop = () => {
    setCropScale(1.12);
    setCropOffset({ x: 0, y: 0 });
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

        <div className="relative overflow-hidden rounded-3xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-gray-900/40 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-brand-primary/20 blur-3xl" />
            <div className="absolute right-6 bottom-4 h-32 w-32 rounded-full bg-brand-accent/20 blur-3xl" />
          </div>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] items-center relative">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary shadow-sm">
                Glass-mode update center
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Refresh your avatar with precision</h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl">
                Drop in a new photo, drag to re-center, and fine tune the zoom before we save it. The glass panel keeps everything crisp while your changes shimmer into place.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-200">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 dark:bg-gray-800/70 px-3 py-2 shadow-sm">
                  <Icon name="magic" className="w-4 h-4 text-brand-primary" />
                  Live glass preview
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 dark:bg-gray-800/70 px-3 py-2 shadow-sm">
                  <Icon name="crop" className="w-4 h-4 text-brand-secondary" />
                  Drag to crop
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 dark:bg-gray-800/70 px-3 py-2 shadow-sm">
                  <Icon name="sparkle" className="w-4 h-4 text-brand-accent" />
                  Smooth confirmation toast
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openFilePicker}
                  disabled={uploading}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-3 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <span className="absolute inset-0 bg-white/30 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2 font-semibold">
                    {uploading ? "Uploading..." : "Choose a new photo"}
                  </span>
                </button>

                <button
                  onClick={resetCrop}
                  className="rounded-full border border-white/50 bg-white/70 px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur dark:bg-gray-800/60 dark:text-gray-100"
                >
                  Reset framing
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-white/20 to-white/0 dark:from-gray-800/60 dark:via-gray-800/30" />
              <div className="relative w-64 h-64 rounded-3xl border border-white/60 bg-white/50 p-3 shadow-inner backdrop-blur-xl dark:border-gray-700/80 dark:bg-gray-800/60">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-primary/15 via-transparent to-brand-accent/20" />
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/60 shadow-lg dark:border-gray-700">
                  <img
                    src={selectedImage || avatarUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 border-2 border-white/60 mix-blend-screen" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                    {selectedImage ? "Ready to crop" : "Current avatar"}
                  </div>
                </div>
              </div>
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

      {isCropModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur"
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onTouchEnd={stopDragging}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-accent/20" />
          <div className="relative z-10 w-[min(960px,92vw)] rounded-3xl border border-white/15 bg-white/90 p-6 shadow-2xl backdrop-blur-3xl dark:border-gray-700/60 dark:bg-gray-900/85 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Crop & align</p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Glass cropper</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Drag the photo, glide the zoom, then save. We will crop it square before uploading.</p>
              </div>
              <button
                onClick={() => setCropModalOpen(false)}
                className="self-end rounded-full border border-white/40 bg-white/70 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/70 dark:bg-gray-800/60 dark:text-gray-100"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px] items-center">
              <div className="relative flex justify-center">
                <div className="relative rounded-[26px] border border-white/50 bg-gradient-to-br from-white/80 via-white/50 to-white/30 p-4 shadow-inner backdrop-blur-xl dark:border-gray-700/80 dark:from-gray-800/90 dark:via-gray-800/70 dark:to-gray-900/70">
                  <div
                    className="relative overflow-hidden rounded-2xl bg-black/5 shadow-xl dark:bg-gray-800/60"
                    style={{ width: frameSize + 32, height: frameSize + 32 }}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={stopDragging}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={stopDragging}
                  >
                    <img
                      src={selectedImage}
                      alt="Crop selection"
                      onLoad={handleImageLoad}
                      className="absolute left-1/2 top-1/2 select-none"
                      style={{
                        width: imageSize.width || 'auto',
                        height: imageSize.height || 'auto',
                        transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${displayedScale})`,
                      }}
                      draggable={false}
                    />
                    <div className="pointer-events-none absolute inset-[14px] rounded-xl border-2 border-white/80 mix-blend-screen shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/40" />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/70">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <span>Zoom & focus</span>
                    <span>{Math.round(cropScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2.2}
                    step={0.02}
                    value={cropScale}
                    onChange={(event) => setCropScale(Number(event.target.value))}
                    className="mt-3 w-full accent-brand-primary"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Slide to zoom into the area you want to spotlight.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={resetCrop}
                    className="rounded-xl border border-white/60 bg-white/80 px-4 py-3 font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/70 dark:bg-gray-800/70 dark:text-gray-100"
                  >
                    Center crop
                  </button>
                  <button
                    onClick={handleCropAndUpload}
                    disabled={uploading}
                    className="rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {uploading ? 'Saving...' : 'Save & upload'}
                  </button>
                </div>

                <div className="rounded-xl border border-white/50 bg-white/70 p-3 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-gray-700/70 dark:bg-gray-800/70 dark:text-gray-300">
                  Tip: drag the photo to reposition your face inside the square frame. We will apply a crisp square crop before sending it to the cloud.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="toast-float flex items-center gap-3 rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-gray-900 shadow-xl ring-1 ring-white/50 backdrop-blur dark:bg-gray-900/90 dark:text-white dark:ring-gray-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-inner">
              <Icon name="sparkle" className="h-4 w-4" />
            </div>
            {toastMessage}
          </div>
        </div>
      )}

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
