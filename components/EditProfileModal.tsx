import React, { useState } from 'react';
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import { updateUserProfile } from '../services/firestoreService.ts';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: { name: string; bio: string }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        
        setError('');
        setIsLoading(true);

        try {
            const updatedData = { name, bio };
            await updateUserProfile(user.uid, updatedData);
            onSave(updatedData);
            onClose();
        } catch (err) {
            console.error("Failed to update profile:", err);
            setError("Could not save changes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-50 animate-fade-in overflow-y-auto p-4 sm:p-8"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            placeholder="Tell us a little about yourself"
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-lg outline-none transition"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                <div className="mt-6 flex justify-end space-x-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-all duration-300 shadow-lg hover:shadow-brand-primary/50 transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:scale-100 disabled:shadow-none"
                    >
                        {isLoading ? <Icon name="spinner" className="w-5 h-5 animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;