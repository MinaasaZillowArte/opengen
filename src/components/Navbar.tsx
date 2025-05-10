'use client';

import Link from 'next/link';
import { FiCpu, FiMenu, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi'; // Removed FiMessageSquare, Added FiChevronDown, FiChevronRight
import { IconType } from 'react-icons';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Constants for Navbar heights
const NAVBAR_HEIGHT_MOBILE = 70; // px - Standardized
const NAVBAR_HEIGHT_DESKTOP = 80; // px - Standardized

interface NavbarProps {
  // isTransparent prop is removed as Navbar now manages its own scroll state
}

// New NavItem structure for dropdowns
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
  href?: string; // Optional: if the group label itself is a link
}

type NavItemType = NavLink | NavGroup;

// Type guard
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
          { href: '/research/rsm/model-scaling', label: 'Model Scaling & Efficiency' },
          { href: '/research/rsm/interpretability', label: 'AI Interpretability' },
          { href: '/research/rsm/long-context', label: 'Long-Context Processing' },
          { href: '/research/rsm/multimodal-fusion', label: 'Multimodal Fusion AI' },
          { href: '/research/rsm/alignment', label: 'AI Alignment Research' },
        ],
      },
      { href: '/research/papers', label: 'Publications', description: "Read our latest papers." },
      { href: '/#research-section', label: 'Research Overview' },
    ],
  },
  {
    label: 'Products',
    children: [
      { href: '/chatllm', label: 'ChatNPT', description: "Access our flagship AI model." },
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

export default function Navbar({}: NavbarProps) {
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
  }, []);

  const toggleMobileSubmenu = useCallback((label: string) => {
    setOpenMobileSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const isTransparentEffective = isMounted && pathname === '/' && !isScrolled && !isMobileMenuOpen;

  const navbarBaseClasses = "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out";
  const navbarHeightClass = `h-[${NAVBAR_HEIGHT_MOBILE}px] md:h-[${NAVBAR_HEIGHT_DESKTOP}px]`;

  const navbarStyleClasses = isTransparentEffective
    ? "bg-transparent shadow-none"
    : "bg-[var(--bg-primary)]/90 backdrop-blur-lg shadow-md"; // Adjusted opacity and shadow

  const linkBaseClasses = "text-sm font-medium transition-all duration-200 ease-in-out relative"; // Added relative for pseudo-elements
  const linkColorClasses = isTransparentEffective
    ? "text-white hover:text-gray-100"
    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]";

  const logoIconColorClasses = isTransparentEffective
    ? "text-white"
    : "text-[var(--color-primary)]";
  
  const logoTextColorClasses = isTransparentEffective
    ? "text-white"
    : "text-[var(--text-primary)]";

  // Explicit color for mobile menu icon based on navbar transparency
  const mobileIconColorClass = isTransparentEffective
    ? "text-white hover:text-gray-200"
    : "text-[var(--text-primary)] hover:text-[var(--color-primary)]";

  // Framer Motion variants
  // NEW Mobile Menu (Slide from Right)
  const mobileMenuOverlayVariants = {
    hidden: { x: "100%", opacity: 0.8, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }, // VALID BEZIER
    visible: { x: "0%", opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }, // VALID BEZIER
    exit: { x: "100%", opacity: 0.8, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.1 } }, // VALID BEZIER
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

  const iconTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] }; // VALID BEZIER
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
  
  // NEW Desktop Dropdown Variants
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
    // Fallback for SSR or before hydration, ensures layout consistency
    return <div className={`${navbarBaseClasses} ${navbarHeightClass} bg-[var(--bg-primary)]`} />;
  }

  return (
    <>
      <motion.nav className={`${navbarBaseClasses} ${navbarHeightClass} ${navbarStyleClasses}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="OpenGen Homepage" onClick={closeMobileMenu}>
            <FiCpu className={`w-7 h-7 md:w-8 md:h-8 transition-colors duration-300 ${logoIconColorClasses} group-hover:text-[var(--color-secondary)]`} />
            <span className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${logoTextColorClasses} group-hover:text-[var(--color-secondary)]`}>
              OpenGen
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinksData.map((item) => {
              if (isNavGroup(item)) {
                // Render dropdown menu item
                return (
                  <motion.div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => { setOpenDesktopDropdown(item.label); setOpenDesktopSubDropdown(null); }}
                    onMouseLeave={() => { setOpenDesktopDropdown(null); setOpenDesktopSubDropdown(null); }}
                  >
                    <button
                      className={`${linkBaseClasses} ${linkColorClasses} py-2 flex items-center group focus:outline-none
                                  after:h-[2px] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:bg-[var(--color-primary)] 
                                  after:transition-all after:duration-300 hover:after:w-full ${openDesktopDropdown === item.label ? 'after:w-full' : ''}`}
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
                          className="absolute left-0 mt-3 w-72 bg-[var(--card-bg)] rounded-lg shadow-2xl z-40 border border-[var(--border-color)] py-3"
                        >
                          {item.children.map((child) => {
                            if (isNavGroup(child)) { // Nested dropdown (e.g., RSM)
                              return (
                                <div 
                                  key={child.label} 
                                  className="relative"
                                  onMouseEnter={() => setOpenDesktopSubDropdown(child.label)}
                                  // onMouseLeave={() => setOpenDesktopSubDropdown(null)} // Handled by parent
                                >
                                  <Link
                                    href={child.href || '#'} // Use href if group label is a link
                                    passHref
                                    legacyBehavior // Ensures legacyBehavior is true when an <a> tag is a child
                                  >
                                    <a className="w-full px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex justify-between items-center rounded-md transition-colors duration-150">
                                      <span>{child.label}</span>
                                      <FiChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover/sub:text-[var(--text-primary)]" />
                                    </a>
                                  </Link>
                                  <AnimatePresence>
                                  {openDesktopSubDropdown === child.label && (
                                    <motion.div
                                      variants={subDropdownVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      className="absolute left-full -top-3 ml-2 w-72 bg-[var(--card-bg)] rounded-lg shadow-2xl z-50 border border-[var(--border-color)] py-3"
                                    >
                                      {child.children.map(subChild => (
                                        <Link key={subChild.label} href={(subChild as NavLink).href} passHref legacyBehavior>
                                          <a className="block px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors duration-150">
                                            {subChild.label}
                                            {(subChild as NavLink).description && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{ (subChild as NavLink).description}</p>}
                                          </a>
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                                  </AnimatePresence>
                                </div>
                              );
                            }
                            // Regular dropdown link
                            return (
                              <Link key={child.label} href={(child as NavLink).href} passHref legacyBehavior>
                                <a className="block px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors duration-150">
                                  {child.label}
                                  {(child as NavLink).description && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{(child as NavLink).description}</p>}
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
              // Render regular link
              return (
                <motion.div key={item.label} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={(item as NavLink).href}
                    className={`${linkBaseClasses} ${linkColorClasses} py-2
                                after:h-[2px] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 
                                after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-full`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Menu Toggle (CTA Button Removed) */}
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                onClick={toggleMobileMenu}
                className={`p-2.5 rounded-md ${mobileIconColorClass} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] transition-colors duration-200`}
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
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`md:hidden fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm bg-[var(--bg-secondary)] shadow-2xl z-40 overflow-y-auto`} // Slide from right
          >
            <motion.div 
              className={`px-5 py-8 flex flex-col h-full pt-[${NAVBAR_HEIGHT_MOBILE + 10}px]`} // Add padding top for close button area
              variants={mobileNavContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ '--navbar-height-mobile': `${NAVBAR_HEIGHT_MOBILE}px` } as React.CSSProperties} // For calc()
            >
              <nav className="flex-grow">
                <ul className="space-y-2">
                  {navLinksData.map((item) => {
                    if (isNavGroup(item)) {
                      return (
                        <motion.li key={item.label} variants={mobileNavItemVariants} className="overflow-hidden" initial="hidden" animate="visible" exit="exit" className="overflow-hidden" >
                          <button
                            onClick={() => toggleMobileSubmenu(item.label)}
                            className="w-full flex justify-between items-center py-3.5 px-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-all duration-200"
                            aria-expanded={openMobileSubmenus[item.label] || false}
                          >
                            <span>{item.label}</span>
                            <FiChevronDown className={`w-5 h-5 transition-transform duration-300 ${openMobileSubmenus[item.label] ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {openMobileSubmenus[item.label] && (
                              <motion.ul
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="pl-5 mt-1 space-y-1 border-l-2 border-[var(--color-primary)]/30"
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                {item.children.map(child => {
                                  // Simplified for mobile: no nested groups for now, treat all children as links
                                  if (isNavGroup(child) && child.href) { // If group has a main link
                                    return (
                                      <motion.li key={child.label} variants={mobileNavItemVariants} initial="hidden" animate="visible" exit="exit">
                                        <Link href={child.href} className="block py-2.5 px-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-150" onClick={closeMobileMenu}>
                                          {child.label} (Overview)
                                        </Link>
                                      </motion.li>
                                    );
                                  }
                                  return (
                                    <motion.li key={child.label} variants={mobileNavItemVariants} >
                                      <Link href={(child as NavLink).href} className="block py-2.5 px-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-150" onClick={closeMobileMenu}>
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
                          className="block py-3.5 px-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-all duration-200"
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Copyright remains, CTA button removed */}
              <motion.div className="mt-auto pt-6 pb-5 text-center" variants={mobileNavItemVariants}>
                <p className="text-xs text-[var(--text-tertiary)]">
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