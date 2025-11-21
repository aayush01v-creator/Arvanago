import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);
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
    setImageValidationMessage(null);
    setCropModalOpen(true);
    setDragStart(null);
    if (e.target) e.target.value = "";
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const nextSize = {
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    };
    setImageSize(nextSize);

    if (nextSize.width < 200 || nextSize.height < 200) {
      setImageValidationMessage("Images must be at least 200x200 pixels.");
      return;
    }

    if (nextSize.width > 6000 || nextSize.height > 6000) {
      setImageValidationMessage("Images must be smaller than 6000x6000 pixels.");
      return;
    }

    setImageValidationMessage(null);
  };

  const baseScale = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return 1;
    return Math.max(frameSize / imageSize.width, frameSize / imageSize.height);
  }, [frameSize, imageSize.height, imageSize.width]);

  const clampOffsetForScale = useCallback(
    (
      offset: { x: number; y: number },
      scale: number = cropScale
    ) => {
      if (!imageSize.width || !imageSize.height) return offset;
      const scaledWidth = imageSize.width * baseScale * scale;
      const scaledHeight = imageSize.height * baseScale * scale;
      const maxX = Math.max(0, (scaledWidth - frameSize) / 2);
      const maxY = Math.max(0, (scaledHeight - frameSize) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, offset.x)),
        y: Math.max(-maxY, Math.min(maxY, offset.y)),
      };
    },
    [baseScale, cropScale, frameSize, imageSize.height, imageSize.width]
  );

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

    ctx.save();
    ctx.translate(frameSize / 2 + cropOffset.x, frameSize / 2 + cropOffset.y);
    ctx.scale(displayedScale, displayedScale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const filename = pendingFile?.name?.replace(/\.[^.]+$/, '') || 'avatar';
        resolve(new File([blob], `${filename}-cropped.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  };

  const handleCropAndUpload = async () => {
    if (!selectedImage || imageValidationMessage) return;
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

  const stopDragging = useCallback(() => setDragStart(null), []);

  const handleDragStart: React.MouseEventHandler<HTMLDivElement> = (event) => {
    setDragStart({ x: event.clientX - cropOffset.x, y: event.clientY - cropOffset.y });
  };

  const handleDragMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!dragStart) return;
    setCropOffset(clampOffsetForScale({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y }));
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const touch = event.touches[0];
    setDragStart({ x: touch.clientX - cropOffset.x, y: touch.clientY - cropOffset.y });
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!dragStart) return;
    const touch = event.touches[0];
    setCropOffset(clampOffsetForScale({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y }));
  };

  const handleDragMoveGlobal = useCallback(
    (event: MouseEvent) => {
      if (!dragStart) return;
      setCropOffset(
        clampOffsetForScale({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
      );
    },
    [clampOffsetForScale, dragStart]
  );

  const handleTouchMoveGlobal = useCallback(
    (event: TouchEvent) => {
      if (!dragStart) return;
      const touch = event.touches[0];
      if (!touch) return;
      setCropOffset(
        clampOffsetForScale({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
      );
    },
    [clampOffsetForScale, dragStart]
  );

  const resetCrop = () => {
    setCropScale(1.12);
    setCropOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    setCropOffset((current) => clampOffsetForScale(current));
  }, [clampOffsetForScale]);

  useEffect(() => {
    if (!dragStart) return;

    const handleMouseUp = () => stopDragging();

    window.addEventListener('mousemove', handleDragMoveGlobal);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMoveGlobal, { passive: true });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleDragMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMoveGlobal);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [dragStart, handleDragMoveGlobal, handleTouchMoveGlobal, stopDragging]);

  // Calculate level progress
  const pointsForCurrentLevel = (user.level - 1) * 1000;
  const pointsForNextLevel = user.level * 1000;
  const pointsInCurrentLevel = user.points - pointsForCurrentLevel;
  const pointsNeededForLevelUp = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForLevelUp) * 100));

  const cropModal =
    isCropModalOpen && selectedImage
      ? createPortal(
          (
            <div
              className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur py-6 sm:py-10 overflow-y-auto"
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              onTouchEnd={stopDragging}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-accent/20" />
              <div className="relative z-10 w-[min(980px,94vw)] rounded-3xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-gray-700/60 dark:bg-gray-900/90 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-primary">Profile picture</p>
                    <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white">Crop image</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Image preview (1:1). Minimum 200x200 pixels, Maximum 6000x6000 pixels.</p>
                  </div>
                  <button
                    onClick={() => setCropModalOpen(false)}
                    className="self-end rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/70 dark:bg-gray-800/70 dark:text-gray-100"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px] items-start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <span>Image preview</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Crop image</span>
                    </div>
                    <div className="relative flex justify-center">
                      <div className="relative rounded-[26px] border border-white/50 bg-gradient-to-br from-white/80 via-white/50 to-white/30 p-4 shadow-inner backdrop-blur-xl dark:border-gray-700/80 dark:from-gray-800/90 dark:via-gray-800/70 dark:to-gray-900/70">
                        <div
                          className="relative overflow-hidden rounded-2xl bg-black/5 shadow-xl dark:bg-gray-800/60 cursor-grab active:cursor-grabbing"
                          style={{ width: frameSize + 32, height: frameSize + 32 }}
                          onMouseDown={handleDragStart}
                          onMouseMove={handleDragMove}
                          onMouseUp={stopDragging}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={stopDragging}
                          aria-label="Crop region"
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
                          <div
                            className="absolute inset-0"
                            onMouseDown={handleDragStart}
                            onMouseMove={handleDragMove}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                          >
                            <div className="pointer-events-none absolute inset-[14px] rounded-xl border-2 border-dashed border-white/85 mix-blend-screen shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />
                            <div className="pointer-events-none absolute inset-[14px] rounded-xl">
                              {[['left-3', 'top-3'], ['right-3', 'top-3'], ['left-3', 'bottom-3'], ['right-3', 'bottom-3']].map((pos, index) => (
                                <span
                                  key={index}
                                  className={`absolute h-3 w-3 rounded-[6px] border-2 border-white/90 bg-white/80 shadow ${pos.join(' ')}`}
                                />
                              ))}
                            </div>
                            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/70">
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
                        onChange={(event) => {
                          const nextScale = Number(event.target.value);
                          setCropScale(nextScale);
                          setCropOffset((current) => clampOffsetForScale(current, nextScale));
                        }}
                        className="mt-3 w-full accent-brand-primary"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Drag to position the dotted square over the part of the photo you want to keep. We will crop it to a perfect square before saving.</p>
                      {imageValidationMessage && (
                        <p className="mt-2 text-xs font-medium text-red-500">{imageValidationMessage}</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/70 space-y-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <span>Center crop</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">1:1 ratio</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={resetCrop}
                          className="w-full rounded-xl border border-white/70 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700/60 dark:bg-gray-800 dark:text-gray-100"
                          disabled={uploading}
                        >
                          Center crop
                        </button>
                        <button
                          onClick={handleCropAndUpload}
                          disabled={uploading || !!imageValidationMessage}
                          className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {uploading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/70">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 200x200 pixels, Maximum 6000x6000 pixels. Avoid blurry or dark photos for best results.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          document.body
        )
      : null;

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
                aria-label="Change profile photo"
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


      {cropModal}
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
