'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
    motion
} from 'framer-motion';
import {
    FiHeart,
    FiGithub,
    FiTwitter,
    FiLinkedin,
    FiRss
} from 'react-icons/fi';

const DecorativeSvg = React.memo(({ className }: { className?: string }) => {
    return (
        <motion.svg
            className={`absolute bottom-0 left-0 w-64 h-64 text-[var(--color-primary)] opacity-5 dark:opacity-[0.03] pointer-events-none ${className}`}
            fill="none"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 1, delay: 0.5 }}
        >
            <motion.path
                d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <motion.circle
                cx="100"
                cy="100"
                r="50"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
        </motion.svg>
    );
});
DecorativeSvg.displayName = 'DecorativeSvg';

const SocialLink = React.memo(({ href, Icon, label }: { href: string; Icon: React.ElementType; label: string }) => {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            whileHover={{ y: -3, scale: 1.1, color: 'var(--color-primary)' }}
            whileTap={{ scale: 0.9 }}
            className="text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors duration-200"
        >
            <Icon className="w-5 h-5"/>
        </motion.a>
    );
});
SocialLink.displayName = 'SocialLink';

export default function Footer() {

    const footerVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut', staggerChildren: 0.1 } }
    }), []);

    const itemVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    }), []);

    const heartVariants = useMemo(() => ({
        beat: { scale: [1, 1.15, 1], transition: { duration: 1.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] } }
    }), []);

    return (
        <motion.footer
            className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] relative overflow-hidden"
            variants={footerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <DecorativeSvg />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-[var(--border-color)] pb-8 mb-8">
                    <motion.div variants={itemVariants}>
                        <Link href="/" className="text-2xl font-bold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors duration-300">
                            OpenGen
                        </Link>
                    </motion.div>

                    <motion.nav variants={itemVariants} className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
                        <Link href="#" className="text-sm hover:text-[var(--text-primary)] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="text-sm hover:text-[var(--text-primary)] transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="#api-section" className="text-sm hover:text-[var(--text-primary)] transition-colors">
                            API Status
                        </Link>
                    </motion.nav>

                    <motion.div variants={itemVariants} className="flex justify-center md:justify-end space-x-5">
                        <SocialLink href="#" Icon={FiTwitter} label="Twitter / X"/>
                        <SocialLink href="#" Icon={FiGithub} label="GitHub"/>
                        <SocialLink href="#" Icon={FiLinkedin} label="LinkedIn"/>
                        <SocialLink href="#" Icon={FiRss} label="Blog Feed"/>
                    </motion.div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="text-center text-sm flex flex-col sm:flex-row justify-center items-center gap-1"
                >
                    <span>© {new Date().getFullYear()} OpenGen Initiative.</span>
                    <span className="flex items-center gap-1">
                        Built with
                        <motion.span
                            variants={heartVariants}
                            animate="beat"
                            className="inline-block text-red-500"
                        >
                            <FiHeart className="w-4 h-4 fill-current"/>
                        </motion.span>
                        in Jakarta.
                    </span>
                </motion.div>
            </div>
        </motion.footer>
    );
}