// components/EmailVerificationNotice.tsx
'use client';

import React, { useState } from 'react';
import { FiMail, FiLoader, FiAlertCircle, FiSend, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase'; // Pastikan path ini benar
import { sendEmailVerification, User, signOut } from 'firebase/auth';
import { getFriendlyFirebaseAuthError } from '@/lib/firebaseErrorMap';

interface EmailVerificationNoticeProps {
    user: User;
    onVerificationEmailResent?: () => void;
}

export default function EmailVerificationNotice({ user, onVerificationEmailResent }: EmailVerificationNoticeProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resentMessage, setResentMessage] = useState<string | null>(null);

    const handleResendVerification = async () => {
        setLoading(true);
        setError(null);
        setResentMessage(null);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setResentMessage('Email verifikasi baru telah dikirim. Silakan periksa kotak masuk dan folder spam Anda.');
                if (onVerificationEmailResent) onVerificationEmailResent();
            } else {
                 setError('Sesi pengguna tidak ditemukan. Silakan login ulang.');
            }
        } catch (err: any) {
            setError(getFriendlyFirebaseAuthError(err.code, err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Redirect atau state update akan ditangani oleh onAuthStateChanged di AuthPage
        } catch (error) {
            console.error("Error signing out: ", error);
            setError("Gagal logout. Coba lagi.");
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 text-center"
        >
            <FiMail className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Verifikasi Alamat Email Anda
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Kami telah mengirimkan link verifikasi ke <strong className="text-gray-700 dark:text-gray-200">{user.email}</strong>.
                Silakan klik link tersebut untuk mengaktifkan akun Anda.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Jika Anda tidak menerima email, periksa folder spam atau coba kirim ulang.
                Setelah verifikasi, silakan refresh halaman ini atau login kembali.
            </p>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center"
                >
                    <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                </motion.div>
            )}
            {resentMessage && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-md text-green-700 dark:text-green-300 text-sm flex items-center"
                >
                    <FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {resentMessage}
                </motion.div>
            )}

            <div className="space-y-4">
                <button
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {loading ? <FiLoader className="animate-spin w-5 h-5 mr-2" /> : <FiSend className="w-5 h-5 mr-2" />}
                    {loading ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                    Ganti Akun / Logout
                </button>
            </div>
             <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                Tombol refresh browser mungkin diperlukan setelah verifikasi jika halaman tidak otomatis berubah.
            </p>
        </motion.div>
    );
}