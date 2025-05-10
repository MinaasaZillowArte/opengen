// components/UserProfileSetupModal.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { FiUser, FiSave, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { updateProfile, User } from 'firebase/auth';
import { getFriendlyFirebaseAuthError } from '@/lib/firebaseErrorMap';

interface UserProfileSetupModalProps {
    user: User;
    onProfileUpdated: () => void;
}

export default function UserProfileSetupModal({ user, onProfileUpdated }: UserProfileSetupModalProps) {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!displayName.trim()) {
            setError('Display name cannot be empty.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: displayName.trim() });
                onProfileUpdated();
            } else {
                setError('User session not found. Please log in again.');
            }
        } catch (err: any) {
            setError(getFriendlyFirebaseAuthError(err.code, err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                    Complete Your Profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                    Before you continue, let's set up your display name.
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center"
                    >
                        <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Display Name
                        </label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {loading ? <FiLoader className="animate-spin w-5 h-5 mr-2" /> : <FiSave className="w-5 h-5 mr-2" />}
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}