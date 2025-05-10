// app/auth/page.tsx (atau path Anda)
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiLock, FiMail, FiLogIn, FiUserPlus, FiLoader, FiAlertCircle, FiCpu, FiEye, FiEyeOff } from 'react-icons/fi';
import { auth } from '@/lib/firebase'; // Pastikan path ini benar
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    User,
    signOut
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { getFriendlyFirebaseAuthError } from '@/lib/firebaseErrorMap';
import UserProfileSetupModal from '@/components/UserProfileSetupModal'; // Sesuaikan path jika perlu
import EmailVerificationNotice from '@/components/EmailVerificationNotice'; // Sesuaikan path jika perlu

// Enum untuk state halaman
enum AuthState {
    LOADING_INITIAL_AUTH,
    SHOW_AUTH_FORM,
    AWAITING_EMAIL_VERIFICATION,
    SHOW_PROFILE_SETUP,
}

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING_INITIAL_AUTH);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user); // Simpan user object
                await user.reload(); // Selalu reload untuk mendapatkan status emailVerified terbaru
                const freshUser = auth.currentUser; // Ambil user yang sudah di-reload

                if (freshUser) {
                     if (!freshUser.emailVerified) {
                        setAuthState(AuthState.AWAITING_EMAIL_VERIFICATION);
                    } else if (!freshUser.displayName) {
                        setAuthState(AuthState.SHOW_PROFILE_SETUP);
                    } else {
                        // Semua OK, redirect
                        router.push('/chatllm');
                    }
                } else {
                    // Should not happen if user object exists, but handle defensively
                    setAuthState(AuthState.SHOW_AUTH_FORM);
                }
            } else {
                setCurrentUser(null);
                setAuthState(AuthState.SHOW_AUTH_FORM);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleAuthAction = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setFormLoading(true);

        if (!isLoginMode) {
            if (password.length < 6) {
                setError("Password minimal harus 6 karakter.");
                setFormLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError("Konfirmasi password tidak cocok.");
                setFormLoading(false);
                return;
            }
        }

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged akan menangani redirect atau state change berikutnya
            } else { // Register mode
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (userCredential.user) {
                    await sendEmailVerification(userCredential.user);
                    // User object sudah di-set oleh onAuthStateChanged, 
                    // dan akan masuk ke AWAITING_EMAIL_VERIFICATION
                }
            }
        } catch (err: any) {
            setError(getFriendlyFirebaseAuthError(err.code, err.message));
        } finally {
            setFormLoading(false);
        }
    };

    const handleProfileUpdated = () => {
        // Dipanggil dari UserProfileSetupModal setelah profil diupdate
        // onAuthStateChanged seharusnya mendeteksi perubahan displayName dan redirect
        // Jika tidak, kita bisa paksa reload user state atau redirect
        if (auth.currentUser) {
            auth.currentUser.reload().then(() => {
                 const freshUser = auth.currentUser;
                 if (freshUser && freshUser.emailVerified && freshUser.displayName) {
                    router.push('/chatllm');
                 } else {
                    // Jika masih ada yang kurang, biarkan onAuthStateChanged yang menangani
                    setAuthState(AuthState.SHOW_PROFILE_SETUP); // atau AWAITING_EMAIL_VERIFICATION
                 }
            });
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    // Render berdasarkan authState
    if (authState === AuthState.LOADING_INITIAL_AUTH) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-slate-900">
                <FiLoader className="animate-spin w-12 h-12 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 p-4 overflow-hidden">
            <AnimatePresence mode="wait">
                {authState === AuthState.AWAITING_EMAIL_VERIFICATION && currentUser && (
                    <motion.div key="emailVerification">
                        <EmailVerificationNotice user={currentUser} />
                    </motion.div>
                )}

                {authState === AuthState.SHOW_PROFILE_SETUP && currentUser && (
                    <motion.div key="profileSetup">
                         <UserProfileSetupModal user={currentUser} onProfileUpdated={handleProfileUpdated} />
                    </motion.div>
                )}

                {authState === AuthState.SHOW_AUTH_FORM && (
                    <motion.div
                        key="authForm"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md" // Container untuk form dan logo+footer
                    >
                        <div className="p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-700/50">
                            <div className="text-center mb-8">
                                <Link href="/" className="inline-block mb-4">
                                    <FiCpu className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto transition-transform hover:scale-110" />
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                    {isLoginMode ? 'Selamat Datang!' : 'Buat Akun Baru'}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                                    {isLoginMode ? 'Masuk untuk melanjutkan ke OpenGen AI.' : 'Bergabung dan mulai eksplorasi AI.'}
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700/60 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center"
                                >
                                    <FiAlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleAuthAction} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Alamat Email
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                            placeholder="anda@contoh.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete={isLoginMode ? "current-password" : "new-password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                {!isLoginMode && (
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Konfirmasi Password
                                        </label>
                                        <div className="relative">
                                            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-11 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={toggleConfirmPasswordVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform active:scale-95"
                                    >
                                        {formLoading ? (
                                            <FiLoader className="animate-spin w-5 h-5 mr-2" />
                                        ) : (isLoginMode ? <FiLogIn className="w-5 h-5 mr-2" /> : <FiUserPlus className="w-5 h-5 mr-2" />)}
                                        {formLoading ? 'Memproses...' : (isLoginMode ? 'Masuk' : 'Daftar')}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => { setIsLoginMode(!isLoginMode); setError(null); setEmail(''); setPassword(''); setConfirmPassword(''); }}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                                >
                                    {isLoginMode ? "Belum punya akun? Daftar di sini" : 'Sudah punya akun? Masuk'}
                                </button>
                            </div>
                        </div>
                         <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
                            © {new Date().getFullYear()} OpenGen AI. Hak Cipta Dilindungi.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}