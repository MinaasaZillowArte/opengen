// src/app/research/rsm/page.tsx
'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, useScroll, useTransform, MotionValue, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import { 
    FiCpu, FiEye, FiCalendar, FiArrowRight
} from 'react-icons/fi';

// Import data berita yang sudah dipisah
// Pastikan path ini benar sesuai dengan struktur folder proyek Anda
import { allNewsItemsFromData, featuredNewsData, NewsItem, FeaturedNewsItem } from '@/data/newsData';

const NAVBAR_HEIGHT_DESKTOP_NUM = 80; 

const AnimatedHeroBackground = () => {
    const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100, scale: 0.2 + Math.random() * 0.6,
        duration: 10 + Math.random() * 10, delay: Math.random() * 5,
    })), []);
    return (
        <motion.div 
            className="absolute inset-0 w-full h-full overflow-hidden z-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, ease:"linear" }}
        >
            <svg width="100%" height="100%" className="opacity-[0.07] md:opacity-[0.1]">
                {particles.map(p => (
                    <motion.circle
                        key={p.id} cx={`${p.x}%`} cy={`${p.y}%`} r={p.scale * 2} 
                        fill="rgba(100, 120, 180, 0.3)"
                        animate={{
                            cx: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 20}%`, `${p.x}%`],
                            y: [`${p.y}%`, `${p.y + (Math.random() - 0.5) * 20}%`, `${p.y}%`],
                            scale: [p.scale, p.scale * 1.5, p.scale],
                        }}
                        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                    />
                ))}
            </svg>
        </motion.div>
    );
};
AnimatedHeroBackground.displayName = "AnimatedHeroBackground";

const AnimatedWord = ({ text, delay, yStart = 10, scaleStart = 0.9, rotateStart = -3, className="" }: { text: string, delay: number, yStart?: number, scaleStart?: number, rotateStart?:number, className?:string }) => (
    <motion.span
        className={`inline-block whitespace-pre ${className}`}
        initial={{ opacity: 0, y: yStart, scale: scaleStart, rotate: rotateStart }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
        {text}
    </motion.span>
);

interface CinematicSceneProps { 
  text?: string | React.ReactNode; isTextAnimatedWordByWord?: boolean; 
  wordAnimation?: { yStart?: number, scaleStart?: number, rotateStart?: number }; 
  scrollYProgress: MotionValue<number>; range: [number, number, number, number]; textClassName?: string;
  initialY?: number; animateY?: number; exitY?: number; initialScale?: number; animateScale?: number; exitScale?: number;
  initialRotateX?: number; animateRotateX?: number; exitRotateX?: number;
}

const CinematicScene: React.FC<CinematicSceneProps> = ({
  text, isTextAnimatedWordByWord = false, wordAnimation = {}, scrollYProgress, range,
  textClassName = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center leading-tight",
  initialY = 70, animateY = 0, exitY = -70, initialScale = 0.8, animateScale = 1, exitScale = 0.8,
  initialRotateX = 20, animateRotateX = 0, exitRotateX = -20
}) => {
  const overallOpacity = useTransform(scrollYProgress, range, [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, range, [initialY, animateY, animateY, exitY]);
  const scale = useTransform(scrollYProgress, range, [initialScale, animateScale, animateScale, exitScale]);
  const rotateX = useTransform(scrollYProgress, range, [initialRotateX, animateRotateX, animateRotateX, exitRotateX]);
  const fadeInEnd = (range[0] + range[1]) / 1.8; 
  const fadeOutStart = (range[2] + range[3]) / 2.2;
  const contentOpacity = useTransform(scrollYProgress, [range[0], fadeInEnd, fadeOutStart, range[3]], [0, 1, 1, 0]);
  const words = useMemo(() => (typeof text === 'string' && isTextAnimatedWordByWord ? text.split(' ') : []), [text, isTextAnimatedWordByWord]);

  return (
    <motion.div
      style={{ opacity: overallOpacity, y, scale, rotateX, transformPerspective: '1200px' }}
      className="sticky top-0 h-screen flex flex-col items-center justify-center w-full px-4 sm:px-6 transform-gpu"
    >
      {text && (
        <motion.div style={{opacity: isTextAnimatedWordByWord ? 1 : contentOpacity}} className={typeof text === 'string' || isTextAnimatedWordByWord ? textClassName : ''}>
          {isTextAnimatedWordByWord && typeof text === 'string' ? (
            <h2 className={textClassName}>{words.map((word, i) => (
                <React.Fragment key={i}>
                    <AnimatedWord text={word} delay={range[0] + 0.3 + (i * 0.06)} {...wordAnimation} /> 
                    {i < words.length -1 && ' '}
                </React.Fragment>
            ))}</h2>
          ) : (typeof text === 'string' ? <h2 className={textClassName}>{text}</h2> : text)}
        </motion.div>
      )}
    </motion.div>
  );
};


interface ModelDisplayCardProps {
  modelNameInternal: string; imageSrc: string; description: string; releaseDate: string;
  index: number; highlightColor?: string;
}

const ModelDisplayCard: React.FC<ModelDisplayCardProps> = ({ 
  modelNameInternal, imageSrc, description, releaseDate, index, highlightColor = "text-sky-300"
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(5px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6 + index * 0.08, ease: [0.25, 1, 0.5, 1], delay: index * 0.12 } }
  };
  const contentVariants = {
    initial: { opacity:0, y:10 },
    animate: { opacity:1, y:0, transition: {duration: 0.45, delay: 0.15, ease: "easeOut"} }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out group border border-gray-700/70 hover:border-gray-600/90 flex flex-col transform-gpu"
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 14px 30px -7px rgba(0,0,0,0.4), 0 10px 18px -10px rgba(0,0,0,0.3)"}}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="aspect-square w-full relative overflow-hidden bg-gray-900/50 group-hover:bg-gray-900/70 transition-colors duration-300">
        <Image src={imageSrc} alt={`Visual for ${modelNameInternal}`} width={400} height={400} className="object-cover w-full h-full transition-all duration-400 ease-in-out group-hover:scale-105 group-hover:opacity-90"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/0 opacity-75 group-hover:opacity-90 transition-opacity duration-300"></div>
      </div>
      <motion.div className="p-4 text-left flex-grow flex flex-col" variants={contentVariants} initial="initial" animate="animate">
        <h3 className={`text-lg font-semibold text-gray-100 mb-1 ${highlightColor} transition-colors duration-200`}>{modelNameInternal}</h3>
        <p className="text-xs text-gray-400/90 mb-2 leading-normal flex-grow line-clamp-2 group-hover:text-gray-200 transition-colors">{description}</p>
        <p className="text-xs text-gray-500/80 group-hover:text-gray-400 transition-colors mt-auto">{releaseDate}</p>
      </motion.div>
    </motion.div>
  );
};
ModelDisplayCard.displayName = 'ModelDisplayCard';

// Data model untuk cards, bisa juga dipisah jika banyak atau kompleks
const lightModelsData: ModelDisplayCardProps[] = [
  { modelNameInternal: "NPT 0.5", imageSrc: "/images/npt-0.5.jpg", description: "Ultra-efficient, rapid responses.", releaseDate: "Released October 05 2024", index: 0 },
  { modelNameInternal: "NPT 0.6", imageSrc: "/images/npt-0.6.jpg", description: "Balanced speed & light reasoning.", releaseDate: "Released December 21 2024", index: 1 },
  { modelNameInternal: "NPT 0.8", imageSrc: "/images/npt-0.8.jpg", description: "Versatile, enhanced performance.", releaseDate: "Released February 02 2025", index: 2 },
  { modelNameInternal: "NPT 1.0", imageSrc: "/images/npt-1.0.jpg", description: "Flagship light model, diverse creation.", releaseDate: "Released March 04 2025", index: 3 },
];
const thinkSeriesData: ModelDisplayCardProps[] = [
  { modelNameInternal: "NPT 1.5", imageSrc: "/images/npt-1.5.jpg", description: "Next-gen complex task reasoning.", releaseDate: "In Development - Preview Q2 2025", index: 0, highlightColor: "text-purple-400" },
  { modelNameInternal: "NPT 1.0 Think", imageSrc: "/images/npt-1.0-think.jpg", description: "Leading deep reasoning & agentic behavior.", releaseDate: "Released March 08 2025", index: 1, highlightColor: "text-purple-400" },
];

// Definisi newsItemsData dan featuredNewsData sudah DIHAPUS dari sini.
// Sekarang diimpor dari @/data/newsData

const NewsListItemCard: React.FC<NewsItem & { index: number; className?: string; }> = ({ title, imageSrc, date, category, index, href, className }) => {
    return (
        <motion.a 
            href={href || "#"} 
            className={`flex items-start gap-x-4 md:gap-x-5 p-3 md:p-4 rounded-lg transition-colors duration-150 group focus-visible:ring-2 focus-visible:ring-sky-400 outline-none hover:bg-white/[.04] ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ x: 3, transition: { type: "spring", stiffness:280, damping:18 } }}
        >
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-md overflow-hidden flex-shrink-0 bg-gray-700/30 border border-gray-600/20 shadow">
                <Image src={imageSrc} alt={title} width={144} height={144} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-250 ease-in-out" />
            </div>
            <div className="flex-grow min-w-0 pt-1">
                <span className="text-xs sm:text-[0.7rem] md:text-xs text-sky-400/90 mb-1 block group-hover:text-sky-300 transition-colors font-semibold tracking-wider uppercase">{category}</span>
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-100 group-hover:text-white transition-colors leading-tight line-clamp-2 sm:line-clamp-3 mb-1.5 md:mb-2">{title}</h4>
                <p className="text-xs md:text-sm text-gray-400/80 group-hover:text-gray-300/90 transition-colors flex items-center"><FiCalendar className="inline w-3.5 h-3.5 mr-1.5 text-gray-500"/>{date}</p>
            </div>
        </motion.a>
    );
};

const FeaturedNewsDisplay: React.FC<FeaturedNewsItem> = ({ title, imageSrc, date, category, fullDescription, href }) => {
    const contentVariant = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1, delayChildren: 0.15 } },
        exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } }
    };
    return (
        <motion.div 
            key={title} 
            className="flex flex-col h-full p-2 md:p-3" 
            variants={contentVariant} initial="initial" animate="animate" exit="exit"
        >
            <motion.div 
                className="relative w-full aspect-square overflow-hidden rounded-xl shadow-xl group mb-4 md:mb-6 border-2 border-transparent hover:border-purple-600/40 transition-all duration-300"
                variants={contentVariant}
            >
                <Image src={imageSrc} alt={title} layout="fill" objectFit="cover" className="transition-transform duration-400 ease-out group-hover:scale-105"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                 <span className="absolute top-4 left-4 bg-purple-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-md">{category}</span>
            </motion.div>
            <div className="flex flex-col flex-grow mt-1">
                <motion.h3 
                    variants={contentVariant}
                    className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-50 mb-3 md:mb-4 leading-tight hover:text-purple-200 transition-colors"
                >
                    <a href={href || "#"}>{title}</a>
                </motion.h3>
                <motion.p 
                    variants={contentVariant}
                    className="text-gray-300 text-sm md:text-base leading-relaxed mb-4 md:mb-6 line-clamp-3 sm:line-clamp-4 md:line-clamp-none flex-grow"
                >
                    {fullDescription}
                </motion.p>
                <motion.div 
                    variants={contentVariant}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto pt-3 border-t border-gray-700/40"
                >
                    <p className="text-xs text-gray-400 flex items-center mb-2 sm:mb-0"><FiCalendar className="inline w-3.5 h-3.5 mr-1.5 text-gray-500"/>{date}</p>
                    <a href={href || "#"} className="text-sm text-sky-400 hover:text-sky-300 font-semibold flex items-center group/link">
                        Learn more <FiArrowRight className="ml-1.5 w-4 h-4 transform transition-transform duration-200 group-hover/link:translate-x-1" />
                    </a>
                </motion.div>
            </div>
        </motion.div>
    );
};


export default function RSMPage() {
    const latestNewsItems = useMemo(() => allNewsItemsFromData.slice(-15), [allNewsItemsFromData]);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: heroScrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end end']});
    const section2Ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress: section2ScrollY } = useScroll({ target: section2Ref, offset: ['start end', 'center center']});
    const section2Opacity = useTransform(section2ScrollY, [0, 0.5], [0, 1]);
    const section2XText = useTransform(section2ScrollY, [0, 0.5], [-50, 0]);
    const videoOpacity = useTransform(section2ScrollY, [0.1, 0.6], [0, 1]);
    const videoX = useTransform(section2ScrollY, [0.1, 0.6], [50, 0]);
    
    const newsSectionRef = useRef<HTMLDivElement>(null); 
    const newsListRef = useRef<HTMLDivElement>(null);
    const modelShowcaseRef = useRef<HTMLElement>(null);

    const [activeFeaturedNewsIndex, setActiveFeaturedNewsIndex] = useState(0);
    const [isLgScreen, setIsLgScreen] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsLgScreen(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);
    
    const { scrollYProgress: newsListScrollProgress } = useScroll({ container: newsListRef });

    useEffect(() => {
        // Hanya jalankan jika featuredNewsData memiliki lebih dari 1 item dan layar adalah lg
        if (!isLgScreen || featuredNewsData.length <= 1) return; 
        
        const unsubscribe = newsListScrollProgress.on("change", (latestValue) => {
            // Tentukan jumlah featured news yang tersedia
            const numFeaturedNews = featuredNewsData.length;
            if (numFeaturedNews <= 1) return; // Tidak perlu ganti jika hanya 1 atau 0

            // Bagi daftar berita menjadi beberapa bagian berdasarkan jumlah featured news
            // Misalnya, jika ada 2 featured news, trigger point adalah di tengah (10/15 dalam contoh asli)
            // Jika ada 3, mungkin di 1/3 dan 2/3 dari scroll
            // Ini adalah contoh sederhana untuk 2 featured news, perlu disesuaikan jika lebih
            const triggerPoint = (allNewsItemsFromData.length * (1 / numFeaturedNews)) / allNewsItemsFromData.length; // Normalisasi ke 0-1

            // Logika sederhana untuk beralih antara dua berita unggulan
            // Anda mungkin perlu logika yang lebih canggih jika featuredNewsData > 2
            if (latestValue > triggerPoint && activeFeaturedNewsIndex === 0) { 
                setActiveFeaturedNewsIndex(1 % numFeaturedNews); // % numFeaturedNews untuk jaga-jaga
            } else if (latestValue <= triggerPoint && activeFeaturedNewsIndex === 1 % numFeaturedNews) {
                setActiveFeaturedNewsIndex(0);
            }
            // Jika Anda memiliki lebih dari 2 featured news, Anda perlu memodifikasi logika ini
            // untuk beralih ke activeFeaturedNewsIndex berikutnya.
        });
        return () => unsubscribe();
    }, [newsListScrollProgress, activeFeaturedNewsIndex, isLgScreen, featuredNewsData.length, allNewsItemsFromData.length]);


    const heroTexts: CinematicSceneProps[] = [
        { scrollYProgress: heroScrollYProgress, text: "Glimpses of the Unseen", range: [0, 0.05, 0.15, 0.20], textClassName: "text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-thin tracking-wider text-gray-200 text-shadow-xl", initialY: 100, animateY: 0, exitY: -100, initialScale: 0.7, initialRotateX: 30, exitRotateX: -30, isTextAnimatedWordByWord: true, wordAnimation: { yStart: 30, scaleStart: 0.7, rotateStart: -10 } },
        { scrollYProgress: heroScrollYProgress, text: ( <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-white text-shadow-xl tracking-tighter text-center"> Forged in <span className="text-sky-300">Code</span> <br /> <span className="italic">Fueled by</span> <span className="text-purple-400">Curiosity</span> </h1> ), range: [0.20, 0.25, 0.35, 0.40], initialScale: 1.2, animateScale: 1, exitScale: 1.2, initialY: 0, initialRotateX: 0, },
        { scrollYProgress: heroScrollYProgress, text: "The Algorithm of Openness", range: [0.40, 0.45, 0.55, 0.60], textClassName: "italic text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-teal-200 font-['Georgia',_serif] tracking-normal text-shadow-lg text-center", initialY: 60, animateY: 0, exitY: -60, initialScale: 0.9, initialRotateX: -20, animateRotateX: 0, exitRotateX: 20, isTextAnimatedWordByWord: true, wordAnimation: { yStart: 15, scaleStart: 0.9 } },
        { scrollYProgress: heroScrollYProgress, text: ( <div className="text-center relative"> <motion.div className="absolute -inset-16 sm:-inset-24 md:-inset-32 bg-gradient-radial from-amber-500/20 via-amber-500/5 to-transparent rounded-full filter blur-3xl" style={{ opacity: useTransform(heroScrollYProgress, [0.58, 0.65, 0.75, 0.82], [0, 0.5, 0.5, 0]), scale: useTransform(heroScrollYProgress, [0.58, 0.65, 0.75, 0.82], [0.5, 1, 1, 0.5]), }} /> <h1 className="relative z-10"> <motion.span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-amber-400 uppercase tracking-wider text-shadow-xl" initial={{letterSpacing: '-0.05em', opacity:0}} animate={{letterSpacing: '0.05em', opacity:1}} transition={{delay:0.65, duration: 0.8, ease:"circOut"}} >Collective Intelligence</motion.span> <motion.span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-300 mt-3 md:mt-5 text-shadow-md" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.70, duration:0.7, ease:"easeOut"}} > Limitless Potential </motion.span> </h1> </div> ), range: [0.60, 0.65, 0.75, 0.80], initialY: 80, exitY: -80, initialScale: 0.8, },
        { scrollYProgress: heroScrollYProgress, text: ( <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-red-500 to-orange-400 text-shadow-xl text-center tracking-tighter"> Architecting What&apos;s Next </h1> ), range: [0.80, 0.85, 0.95, 1.00], exitY: 0, animateScale: 1, exitScale: 1.1, initialRotateX: 15, initialY:80, isTextAnimatedWordByWord: true, wordAnimation: {yStart: 25, scaleStart: 0.6, rotateStart: 10} },
    ];
  
    const headingVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
    };

    const staggerContainer = { 
        hidden: { opacity: 0 }, 
        visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.25 } } 
    };

    return (
        <div className="bg-black text-white antialiased">
            <Navbar />
            <main className="w-full overflow-x-hidden">
                <section ref={heroRef} className="relative">
                    <AnimatedHeroBackground />
                    <div className="relative z-10" style={{ height: `${heroTexts.length * 100}vh` }}>
                        {heroTexts.map((item, index) => ( <CinematicScene key={`hero-${index}`} {...item} /> ))}
                    </div>
                </section>

                <section ref={section2Ref} className="py-24 md:py-32 bg-gradient-to-b from-black via-gray-950 to-black min-h-[70vh] flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                            <motion.div style={{ opacity: section2Opacity, x: section2XText }} className="text-center md:text-left">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-purple-500 to-teal-400 leading-tight">
                                    Researching a New Model
                                </h2>
                                <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
                                    At OpenGen we are constantly pushing the boundaries of artificial intelligence.
                                    Our dedicated team is tirelessly working on the next generation of models,
                                    focusing on enhanced capabilities, ethical considerations, and broader accessibility.
                                </p>
                                <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
                                    This involves deep dives into neural architectures, novel training methodologies,
                                    and robust safety protocols to ensure our advancements benefit everyone openly and freely.
                                </p>
                            </motion.div>
                            <motion.div style={{ opacity: videoOpacity, x: videoX }} className="aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-sky-700/30 transform-gpu">
                                <video src="/rsm_001.mp4" className="w-full h-full object-cover" autoPlay loop muted playsInline preload="auto" />
                            </motion.div>
                        </div>
                    </div>
                </section>
                
                <section ref={newsSectionRef} id="news-research-section" className="relative bg-black text-white py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <motion.div 
                            className="text-center mb-12 md:mb-16"
                            initial={{opacity: 0, y:20}}
                            whileInView={{opacity:1, y:0}}
                            viewport={{once:true, amount: 0.3}}
                            transition={{duration:0.6, ease:"easeOut"}}
                        >
                            <motion.h2 
                                className="text-4xl sm:text-5xl font-black tracking-tighter mb-3"
                                variants={headingVariants} initial="hidden" whileInView="visible"
                            >
                                {"Latest News & Research".split("").map((char, index) => (
                                    <AnimatedWord key={`news-title-${index}`} text={char === " " ? "\u00A0" : char} delay={0.1 + index * 0.03} className="inline-block" yStart={15} />
                                ))}
                            </motion.h2>
                            <p className="text-md md:text-lg text-gray-400 max-w-xl mx-auto">
                                Stay informed with our latest breakthroughs, publications, and insights.
                            </p>
                        </motion.div>

                        <div className="flex flex-col lg:flex-row lg:gap-x-10 xl:gap-x-16">
                            <div className={`lg:w-[55%] xl:w-[60%] ${isLgScreen ? 'lg:sticky' : ''} top-24 self-start order-1`}>
                                <AnimatePresence mode="wait">
                                    {/* Pastikan featuredNewsData tidak kosong sebelum mencoba mengaksesnya */}
                                    {featuredNewsData.length > 0 && (
                                        <FeaturedNewsDisplay
                                            key={featuredNewsData[activeFeaturedNewsIndex % featuredNewsData.length].id}
                                            {...featuredNewsData[activeFeaturedNewsIndex % featuredNewsData.length]}
                                        />
                                    )}
                                </AnimatePresence>
                                 {isLgScreen && <div className="h-24"></div>}
                            </div>
                            
                            <div className={`lg:w-[45%] xl:w-[40%] order-2 mt-10 lg:mt-0 
                                            ${isLgScreen ? 'max-h-[calc(100vh-10rem)]' : 'max-h-[80vh]'} overflow-y-auto scrollbar-hide`}
                                 ref={newsListRef}
                            >
                                <div className="space-y-3.5">
                                {latestNewsItems.map((item, index) => (
                                    <NewsListItemCard key={item.id} {...item} index={index}/>
                                ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <motion.section 
                    ref={modelShowcaseRef} 
                    id="model-showcase-section" 
                    className="py-24 md:py-36 bg-gradient-to-b from-black via-gray-900 to-black" 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true, amount: 0.05 }} 
                    variants={staggerContainer}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 md:mb-20">
                            <motion.h2 
                                className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-100 mb-4 text-shadow-xl tracking-tighter"
                                variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                            >
                                {"NPT Series".split("").map((char, index) => (
                                    <AnimatedWord key={`npt-title-${index}`} text={char === " " ? "\u00A0" : char} delay={0.1 + index * 0.04} className="inline-block" yStart={20} scaleStart={0.8} rotateStart={-5}/>
                                ))}
                            </motion.h2>
                            <motion.p 
                                className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
                                initial={{opacity:0, y:15}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.7, delay:0.4, ease:"easeOut"}}
                            >
                                Our Light Models are fast, versatile, and cost-efficient AI systems designed to understand context, generate content, and more.
                            </motion.p>
                        </div>
                        <motion.div 
                            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{once:true, amount:0.05}}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-24 md:mb-32"
                        >
                            {lightModelsData.map((model) => (
                                <ModelDisplayCard key={`light-${model.modelNameInternal}`} {...model} />
                            ))}
                        </motion.div>

                        <div className="text-center mb-16 md:mb-20">
                            <motion.h2 
                                className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-100 mb-4 text-shadow-xl tracking-tighter"
                                variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                            >
                               {"NPT Think Series".split("").map((char, index) => (
                                    <AnimatedWord key={`think-title-${index}`} text={char === " " ? "\u00A0" : char} delay={0.1 + index * 0.04} className="inline-block" yStart={20} scaleStart={0.8} rotateStart={-5}/>
                                ))}
                            </motion.h2>
                            <motion.p 
                                className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
                                initial={{opacity:0, y:15}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.7, delay:0.4, ease:"easeOut"}}
                            >
                                Our Best Reasoning Models for Task, Agent, Math, and Code.
                            </motion.p>
                        </div>
                        <motion.div 
                            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{once:true, amount:0.05}}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 max-w-4xl mx-auto"
                        >
                            {thinkSeriesData.map((model) => (
                                <ModelDisplayCard key={`think-${model.modelNameInternal}`} {...model} />
                            ))}
                        </motion.div>
                    </div>
                </motion.section>

            </main>
            <Footer />
            <style jsx global>{`
                body { overflow-x: hidden !important; } 
                main { overflow-x: hidden !important; }
                .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
                .text-shadow-md { text-shadow: 0 3px 6px rgba(0,0,0,0.5); }
                .text-shadow-lg { text-shadow: 0 8px 15px rgba(0,0,0,0.5); }
                .text-shadow-xl { text-shadow: 0 15px 25px rgba(0,0,0,0.5); }
                .font-serif { font-family: Georgia, 'Times New Roman', Times, serif; }
                .bg-gradient-radial { background-image: radial-gradient(circle, var(--tw-gradient-stops)); }
                
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
                .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
                .line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
            `}</style>
        </div>
    );
}