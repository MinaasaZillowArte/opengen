// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { FiCpu, FiMenu, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Constants for Navbar heights
const NAVBAR_HEIGHT_MOBILE = 70; // px - Standardized
const NAVBAR_HEIGHT_DESKTOP = 80; // px - Standardized

interface NavLink {
  href: string;
  label: string;
  description?: string;
  icon?: IconType;
}

interface NavGroup {
  label: string;
  icon?: IconType;
  children: (NavLink | NavGroup)[];
  href?: string;
}

type NavItemType = NavLink | NavGroup;

function isNavGroup(item: NavItemType): item is NavGroup {
  return (item as NavGroup).children !== undefined;
}

const navLinksData: NavItemType[] = [
  { href: '/#insights-section', label: 'Insights' },
  {
    label: 'Research',
    children: [
      { href: '/research/chatnpt', label: 'ChatNPT Models', description: "Explore our flagship language models." },
      {
        label: 'RSM Initiatives',
        href: '/research/rsm',
        children: [
          { href: '/research/rsm/deep-thinking', label: 'DeepThinking Architectures' },
          { href: '/research/rsm/model-scaling', label: 'G02K' },
          { href: '/research/rsm/interpretability', label: 'OuX 1.0' },
          { href: '/research/rsm/long-context', label: 'Long-Context Processing' },
          { href: '/research/rsm/multimodal-fusion', label: 'Multimodal Processing NPT' },
          { href: '/research/rsm/alignment', label: 'Intial P' },
        ],
      },
      { href: '/research/papers', label: 'Publications', description: "Read our latest papers." },
      { href: '/#research-section', label: 'Research Overview' },
    ],
  },
  {
    label: 'Products',
    children: [
      { href: '/ChatNPT', label: 'ChatNPT', description: "Access our flagship AI model." },
      { href: '/products/dpl', label: 'Developer Playground (DPL)', description: "Experiment with our models." },
      { href: '/#demo-section', label: 'Live Demos' },
    ],
  },
  {
    label: 'Safety',
    children: [
      { href: '/safety/our-approach', label: 'Our Approach to Safety', description: "How we build safe AI." },
      { href: '/safety/principles', label: 'Ethical Principles' },
      { href: '/safety/moderation', label: 'Content Moderation Tech' },
      { href: '/safety/data-privacy', label: 'Data Privacy & Security' },
      { href: '/safety/responsible-deployment', label: 'Responsible Deployment' },
    ],
  },
  { href: '/#for-everyone-section', label: 'Showcase' },
  { href: '/#api-section', label: 'API' },
];

export default function Navbar() { // Removed unused NavbarProps
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const [openDesktopSubDropdown, setOpenDesktopSubDropdown] = useState<string | null>(null);
  const [openMobileSubmenus, setOpenMobileSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setOpenMobileSubmenus({}); // Close all submenus when main mobile menu closes
  }, []);

  const toggleMobileSubmenu = useCallback((label: string) => {
    setOpenMobileSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  // --- REVISED TRANSPARENCY & STYLING LOGIC ---
  const pagesWithTransparentNavbar = ['/', '/research/rsm']; // Pages that start with a dark hero
  const isSpecialDarkPage = pathname === '/research/rsm'; // Specifically for RSM page styling when opaque

  const isTransparentEffective = isMounted && pagesWithTransparentNavbar.includes(pathname) && !isScrolled && !isMobileMenuOpen;

  const navbarBaseClasses = "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out";
  const navbarHeightClass = `h-[${NAVBAR_HEIGHT_MOBILE}px] md:h-[${NAVBAR_HEIGHT_DESKTOP}px]`;

  let currentNavbarStyleClasses = "";
  let currentLinkColorClasses = "";
  let currentLogoIconColorClasses = "";
  let currentLogoTextColorClasses = "";
  let currentMobileIconColorClass = "";

  if (isTransparentEffective) {
    currentNavbarStyleClasses = "bg-transparent shadow-none";
    currentLinkColorClasses = "text-white hover:text-gray-200"; // Adjusted for better visibility from gray-100
    currentLogoIconColorClasses = "text-white";
    currentLogoTextColorClasses = "text-white";
    currentMobileIconColorClass = "text-white hover:text-gray-200";
  } else if (isSpecialDarkPage && !isTransparentEffective) {
    // Opaque state specifically for /research/rsm page
    currentNavbarStyleClasses = "bg-black/80 backdrop-blur-md shadow-lg"; // Use black, slightly more blur & shadow
    currentLinkColorClasses = "text-gray-300 hover:text-sky-300"; // Lighter text on black
    currentLogoIconColorClasses = "text-sky-400"; // Branded color or white
    currentLogoTextColorClasses = "text-gray-100 hover:text-sky-300";
    currentMobileIconColorClass = "text-gray-200 hover:text-white";
  } else {
    // Default opaque state for other pages (using CSS variables)
    currentNavbarStyleClasses = "bg-[var(--bg-primary)]/90 backdrop-blur-lg shadow-md";
    currentLinkColorClasses = "text-[var(--text-secondary)] hover:text-[var(--text-primary)]";
    currentLogoIconColorClasses = "text-[var(--color-primary)]";
    currentLogoTextColorClasses = "text-[var(--text-primary)]";
    currentMobileIconColorClass = "text-[var(--text-primary)] hover:text-[var(--color-primary)]";
  }
  // --- END OF REVISED LOGIC ---

  const linkBaseClasses = "relative font-medium transition-colors duration-300";

  // Framer Motion variants (no changes here from previous version)
  const mobileMenuOverlayVariants = {
    hidden: { x: "100%", opacity: 0.8, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    visible: { x: "0%", opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { x: "100%", opacity: 0.8, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.1 } },
  };
  const mobileNavContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" } }
  };
  const mobileNavItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
  };
  const iconTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };
  const menuIconVariants = {
    initial: { rotate: 0, opacity: 0 },
    animate: { rotate: 0, opacity: 1, transition: iconTransition },
    exit: { rotate: 45, opacity: 0, transition: iconTransition },
  };
  const closeIconVariants = {
    initial: { rotate: -45, opacity: 0 },
    animate: { rotate: 0, opacity: 1, transition: iconTransition },
    exit: { rotate: 0, opacity: 0, transition: iconTransition },
  };
  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.2, ease: "easeOut" } },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeIn" } },
    exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }
  };
  const subDropdownVariants = {
    hidden: { opacity: 0, x: 10, scale: 0.98, transition: { duration: 0.2, ease: "easeOut" } },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: "easeIn" } },
    exit: { opacity: 0, x: 10, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }
  };

  if (!isMounted) {
    return <div className={`${navbarBaseClasses} ${navbarHeightClass} bg-black md:bg-transparent`} />; // Fallback for SSR, black for mobile on RSM
  }

  return (
    <>
      <motion.nav className={`${navbarBaseClasses} ${navbarHeightClass} ${currentNavbarStyleClasses}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="OpenGen Homepage" onClick={closeMobileMenu}>
            <FiCpu className={`w-7 h-7 md:w-8 md:h-8 transition-colors duration-300 ${currentLogoIconColorClasses} group-hover:text-[var(--color-secondary)]`} />
            <span className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${currentLogoTextColorClasses} group-hover:text-[var(--color-secondary)]`}>
              OpenGen
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinksData.map((item) => {
              const isActive = (item.href && pathname === item.href) || (isNavGroup(item) && item.href && pathname.startsWith(item.href));
              const activeClass = isActive ? (isSpecialDarkPage && !isTransparentEffective ? 'after:w-full text-sky-300' : 'after:w-full text-[var(--color-primary)]') : '';
              
              if (isNavGroup(item)) {
                return (
                  <motion.div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => { setOpenDesktopDropdown(item.label); setOpenDesktopSubDropdown(null); }}
                    onMouseLeave={() => { setOpenDesktopDropdown(null); setOpenDesktopSubDropdown(null); }}
                  >
                    <button
                      className={`${linkBaseClasses} ${currentLinkColorClasses} py-2 flex items-center group focus:outline-none
                                  after:h-[2px] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 
                                  after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-full 
                                  ${openDesktopDropdown === item.label ? 'after:w-full' : ''} ${activeClass}`}
                      aria-haspopup="true"
                      aria-expanded={openDesktopDropdown === item.label}
                    >
                      {item.label}
                      <FiChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${openDesktopDropdown === item.label ? 'transform rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {openDesktopDropdown === item.label && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`absolute left-0 mt-3 w-72 rounded-lg shadow-2xl z-40 border py-3 
                                      ${isSpecialDarkPage && !isTransparentEffective ? 'bg-black border-gray-700' : 'bg-[var(--card-bg)] border-[var(--border-color)]'}`}
                        >
                          {item.children.map((child) => {
                             const childLinkColor = isSpecialDarkPage && !isTransparentEffective ? 'text-gray-300 hover:text-sky-300' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]';
                             const childBgHover = isSpecialDarkPage && !isTransparentEffective ? 'hover:bg-gray-800' : 'hover:bg-[var(--bg-tertiary)]';

                            if (isNavGroup(child)) {
                              return (
                                <div
                                  key={child.label}
                                  className="relative"
                                  onMouseEnter={() => setOpenDesktopSubDropdown(child.label)}
                                >
                                  <Link
                                    href={child.href || '#'}
                                    passHref
                                    legacyBehavior
                                  >
                                    <a className={`w-full px-5 py-3 text-sm ${childLinkColor} ${childBgHover} flex justify-between items-center rounded-md transition-colors duration-150 group/sub`}>
                                      <span>{child.label}</span>
                                      <FiChevronRight className={`w-4 h-4 ${isSpecialDarkPage && !isTransparentEffective ? 'text-gray-500 group-hover/sub:text-sky-300' : 'text-[var(--text-tertiary)] group-hover/sub:text-[var(--text-primary)]'}`} />
                                    </a>
                                  </Link>
                                  <AnimatePresence>
                                  {openDesktopSubDropdown === child.label && (
                                    <motion.div
                                      variants={subDropdownVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      className={`absolute left-full -top-3 ml-2 w-72 rounded-lg shadow-2xl z-50 border py-3
                                                  ${isSpecialDarkPage && !isTransparentEffective ? 'bg-black border-gray-700' : 'bg-[var(--card-bg)] border-[var(--border-color)]'}`}
                                    >
                                      {child.children.map(subChild => (
                                        <Link key={subChild.label} href={(subChild as NavLink).href} passHref legacyBehavior>
                                          <a className={`block px-5 py-3 text-sm ${childLinkColor} ${childBgHover} rounded-md transition-colors duration-150`}>
                                            {subChild.label}
                                            {(subChild as NavLink).description && <p className={`text-xs mt-0.5 ${isSpecialDarkPage && !isTransparentEffective ? 'text-gray-500' : 'text-[var(--text-tertiary)]' }`}>{(subChild as NavLink).description}</p>}
                                          </a>
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                                  </AnimatePresence>
                                </div>
                              );
                            }
                            return (
                              <Link key={child.label} href={(child as NavLink).href} passHref legacyBehavior>
                                <a className={`block px-5 py-3 text-sm ${childLinkColor} ${childBgHover} rounded-md transition-colors duration-150`}>
                                  {child.label}
                                  {(child as NavLink).description && <p className={`text-xs mt-0.5 ${isSpecialDarkPage && !isTransparentEffective ? 'text-gray-500' : 'text-[var(--text-tertiary)]' }`}>{(child as NavLink).description}</p>}
                                </a>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
              return (
                <motion.div key={item.label} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={(item as NavLink).href}
                    className={`${linkBaseClasses} ${currentLinkColorClasses} py-2
                                after:h-[2px] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0
                                after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-full ${activeClass}`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center">
            <div className="md:hidden">
              <motion.button
                onClick={toggleMobileMenu}
                className={`p-2.5 rounded-md ${currentMobileIconColorClass} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] transition-colors duration-200`}
                aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={isMobileMenuOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence initial={false} mode="wait">
                  {!isMobileMenuOpen ? (
                    <motion.div key="menu" variants={menuIconVariants} initial="initial" animate="animate" exit="exit">
                      <FiMenu className="w-6 h-6 md:w-7 md:h-7" />
                    </motion.div>
                  ) : (
                    <motion.div key="close" variants={closeIconVariants} initial="initial" animate="animate" exit="exit">
                      <FiX className="w-6 h-6 md:w-7 md:h-7" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobileMenu"
            variants={mobileMenuOverlayVariants}
            animate="visible"
            exit="exit"
            className={`md:hidden fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm shadow-2xl z-40 overflow-y-auto
                        ${isSpecialDarkPage ? 'bg-black text-gray-200' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}
          >
            <motion.div
              className={`px-5 py-8 flex flex-col h-full pt-[${NAVBAR_HEIGHT_MOBILE + 10}px]`}
              variants={mobileNavContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ '--navbar-height-mobile': `${NAVBAR_HEIGHT_MOBILE}px` } as React.CSSProperties}
            >
              <nav className="flex-grow">
                <ul className="space-y-2">
                  {navLinksData.map((item) => {
                    const mobileLinkColor = isSpecialDarkPage ? 'text-gray-200 hover:text-sky-400' : 'text-[var(--text-primary)] hover:text-[var(--color-primary)]';
                    const mobileSubmenuLinkColor = isSpecialDarkPage ? 'text-gray-400 hover:text-sky-300' : 'text-[var(--text-secondary)] hover:text-[var(--color-primary)]';
                    const mobileBgHover = isSpecialDarkPage ? 'hover:bg-gray-800' : 'hover:bg-[var(--bg-tertiary)]';
                    const mobileBorderColor = isSpecialDarkPage ? 'border-sky-500/30' : 'border-[var(--color-primary)]/30';


                    if (isNavGroup(item)) {
                      return (
                        <motion.li key={item.label} variants={mobileNavItemVariants} className="overflow-hidden">
                          <button
                            onClick={() => toggleMobileSubmenu(item.label)}
                            className={`w-full flex justify-between items-center py-3.5 px-3 text-base font-semibold ${mobileLinkColor} ${mobileBgHover} rounded-md transition-all duration-200`}
                            aria-expanded={openMobileSubmenus[item.label] || false}
                          >
                            <span>{item.label}</span>
                            <FiChevronDown className={`w-5 h-5 transition-transform duration-300 ${openMobileSubmenus[item.label] ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {openMobileSubmenus[item.label] && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={`pl-5 mt-1 space-y-1 border-l-2 ${mobileBorderColor}`}
                              >
                                {item.children.map(child => {
                                  if (isNavGroup(child) && child.href) {
                                    return (
                                      <motion.li key={child.label} variants={mobileNavItemVariants}>
                                        <Link href={child.href} className={`block py-2.5 px-3 text-sm font-medium ${mobileSubmenuLinkColor} ${mobileBgHover} rounded-md transition-all duration-150`} onClick={closeMobileMenu}>
                                          {child.label} (Overview)
                                        </Link>
                                      </motion.li>
                                    );
                                  } else if (isNavGroup(child)) { // Handle nested groups without a direct link
                                     // For simplicity, mobile doesn't deeply nest further here.
                                     // You could implement another level of toggle if needed.
                                     return child.children.map(subItem => (
                                        <motion.li key={subItem.label} variants={mobileNavItemVariants}>
                                            <Link href={(subItem as NavLink).href} className={`block py-2.5 px-3 text-sm font-medium ${mobileSubmenuLinkColor} ${mobileBgHover} rounded-md transition-all duration-150`} onClick={closeMobileMenu}>
                                                {subItem.label}
                                            </Link>
                                        </motion.li>
                                     ));
                                  }
                                  return (
                                    <motion.li key={child.label} variants={mobileNavItemVariants} >
                                      <Link href={(child as NavLink).href} className={`block py-2.5 px-3 text-sm font-medium ${mobileSubmenuLinkColor} ${mobileBgHover} rounded-md transition-all duration-150`} onClick={closeMobileMenu}>
                                        {child.label}
                                      </Link>
                                    </motion.li>
                                  );
                                })}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </motion.li>
                      );
                    }
                    return (
                      <motion.li key={item.label} variants={mobileNavItemVariants}>
                        <Link
                          href={(item as NavLink).href}
                          className={`block py-3.5 px-3 text-base font-semibold ${mobileLinkColor} ${mobileBgHover} rounded-md transition-all duration-200`}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <motion.div className="mt-auto pt-6 pb-5 text-center" variants={mobileNavItemVariants}>
                <p className={`text-xs ${isSpecialDarkPage ? 'text-gray-500': 'text-[var(--text-tertiary)]'}`}>
                  OpenGen &copy; {new Date().getFullYear()}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}