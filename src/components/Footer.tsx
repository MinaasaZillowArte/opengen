'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiHeart,
    FiGithub,
    FiTwitter,
    FiLinkedin,
    FiRss,
    FiMail, // Added for newsletter
    FiArrowUp, // Added for BackToTopButton
    FiChevronRight // For link indicators or general use
} from 'react-icons/fi';

// --- New Decorative SVG for a subtle background pattern ---
const SubtlePatternSvg = React.memo(({ className }: { className?: string }) => {
    return (
        <motion.svg
            className={`absolute inset-0 w-full h-full text-[var(--color-primary)] opacity-5 dark:opacity-[0.02] pointer-events-none ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }}
        >
            <defs>
                <pattern id="footerModernPattern" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="scale(1) rotate(30)">
                    <motion.path
                        d="M0 20 l20 -20 M0 60 l60 -60 M20 80 l60 -60 M80 60 l-20 20"
                        stroke="currentColor"
                        strokeWidth="0.3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 5, delay: Math.random() * 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                    />
                    <motion.circle
                        cx="40" cy="40" r="0.8" fill="currentColor"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1, 0.5, 1, 0], opacity: [0, 1, 1, 1, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: Math.random() * 7 }}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footerModernPattern)" />
        </motion.svg>
    );
});
SubtlePatternSvg.displayName = 'SubtlePatternSvg';

// --- Re-defined SocialLink for consistency within this file, with slight style update ---
const SocialLink = React.memo(({ href, Icon, label }: { href: string; Icon: React.ElementType; label: string }) => {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            whileHover={{ y: -3, scale: 1.1, color: 'var(--color-primary-accent, var(--color-primary))' }} // Use accent or fallback to primary
            whileTap={{ scale: 0.9 }}
            className="text-[var(--text-tertiary)] hover:text-[var(--color-primary-accent, var(--color-primary))] transition-colors duration-200"
        >
            <Icon className="w-5 h-5" />
        </motion.a>
    );
});
SocialLink.displayName = 'SocialLink';

// --- New Helper Component: FooterLink ---
const FooterLink = React.memo(({ href, children, isExternal = false }: { href: string; children: React.ReactNode; isExternal?: boolean }) => {
    return (
        <motion.li
            whileHover={{ x: 4, color: 'var(--color-primary-accent, var(--color-primary))' }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="flex items-center"
        >
            <FiChevronRight className="w-3 h-3 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[var(--color-primary-accent, var(--color-primary))]" />
            <Link
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-[var(--text-secondary)] hover:text-[var(--color-primary-accent, var(--color-primary))] transition-colors duration-200 text-sm py-0.5"
            >
                {children}
            </Link>
        </motion.li>
    );
});
FooterLink.displayName = 'FooterLink';

// --- New Helper Component: FooterSectionTitle ---
const FooterSectionTitle = React.memo(({ children }: { children: React.ReactNode }) => {
    return <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5 tracking-wider uppercase">{children}</h3>;
});
FooterSectionTitle.displayName = 'FooterSectionTitle';


export default function Footer() {
    const footerVariants = useMemo(() => ({
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.15 } }
    }), []);

    const itemVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 25 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } } // Smoother ease
    }), []);

    const heartVariants = useMemo(() => ({
        beat: { scale: [1, 1.25, 1, 1.15, 1], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }
    }), []);

    const currentYear = new Date().getFullYear();

    return (
        <>
            <motion.footer
                className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary-darker,var(--bg-secondary))] text-[var(--text-secondary)] relative overflow-hidden pt-20 pb-10"
                variants={footerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
            >
                <SubtlePatternSvg />
                
                <div className="max-w-screen-xl mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-10 mb-16">
                        {/* Column 1: Brand & About */}
                        <div className="space-y-5">
                            <Link href="/" className="inline-block" aria-label="OpenGen Home">
                                <motion.div 
                                    className="text-3xl font-bold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors duration-300"
                                    whileHover={{ scale: 1.05, textShadow: "0px 0px 8px var(--color-primary-transparent, #fff4)" }}
                                >
                                    OpenGen
                                </motion.div>
                            </Link>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Pioneering the future of open generative AI. Join us in building accessible and innovative AI solutions for everyone.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="sm:pl-4 group"> {/* Added group for FiChevronRight hover effect on children */}
                            <FooterSectionTitle>Quick Links</FooterSectionTitle>
                            <ul className="space-y-3">
                                <FooterLink href="/">Home</FooterLink>
                                <FooterLink href="/about">About Us</FooterLink>
                                <FooterLink href="/blog">Blog</FooterLink>
                                <FooterLink href="/contact">Contact</FooterLink>
                            </ul>
                        </div>

                        {/* Column 3: Resources */}
                        <div className="group">
                            <FooterSectionTitle>Resources</FooterSectionTitle>
                            <ul className="space-y-3">
                                <FooterLink href="#api-section">API Status</FooterLink>
                                <FooterLink href="/docs">Documentation</FooterLink>
                                <FooterLink href="/faq">FAQ</FooterLink>
                                <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
                                <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
                            </ul>
                        </div>

                        {/* Column 4: Connect & Newsletter */}
                        <div>
                            <FooterSectionTitle>Connect</FooterSectionTitle>
                            <div className="flex space-x-5 mb-8">
                                <SocialLink href="#" Icon={FiTwitter} label="Twitter / X"/>
                                <SocialLink href="#" Icon={FiGithub} label="GitHub"/>
                                <SocialLink href="#" Icon={FiLinkedin} label="LinkedIn"/>
                                <SocialLink href="#" Icon={FiRss} label="Blog Feed"/>
                            </div>
                            <FooterSectionTitle>Stay Updated</FooterSectionTitle>
                            <form className="flex shadow-md rounded-lg overflow-hidden">
                                <input 
                                    type="email" 
                                    placeholder="your.email@example.com" 
                                    className="w-full px-4 py-3 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] border border-r-0 border-[var(--border-color)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                    aria-label="Email for newsletter"
                                />
                                <motion.button 
                                    type="submit"
                                    className="px-5 py-3 bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
                                    aria-label="Subscribe to newsletter"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiMail className="w-5 h-5" />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                    <motion.div 
                        variants={itemVariants} 
                        className="border-t border-[var(--border-color-translucent,rgba(255,255,255,0.1))] pt-10 mt-16"
                    >
                        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                &copy; {currentYear} OpenGen Initiative. All rights reserved.
                            </p>
                            <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                                <span>Built with</span>
                                <motion.span
                                    variants={heartVariants}
                                    animate="beat"
                                    className="inline-block text-red-500"
                                >
                                    <FiHeart className="w-4 h-4 fill-current"/>
                                </motion.span>
                                <span>in Jakarta.</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.footer>
        </>
    );
}