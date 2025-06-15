'use client';

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo
} from 'react';
import {
    FiArrowUp, FiCopy, FiX, FiLoader, FiArrowDown, FiCode, FiEdit3, FiBarChart2, FiCpu,
    FiDatabase, FiImage, FiPlayCircle, FiFilter, FiCheckCircle, FiChevronRight, FiUsers, FiBriefcase, FiArrowRight,
    FiPenTool, FiShare2, FiStar, FiSun, FiMoon, FiMail, FiGithub, FiLinkedin, FiTwitter, FiMapPin,
    FiPhone, FiSend, FiCheck, FiTerminal, FiBookOpen, FiMessageSquare, FiZap, FiRefreshCw, FiEye, FiKey,
    FiEyeOff, FiPlay, FiPause, FiGift
} from 'react-icons/fi';
import {
    motion,
    AnimatePresence,
    useScroll,
    useSpring,
    useInView,
    useTransform,
    animate,
    AnimationPlaybackControls
} from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AbstractSvgPlaceholder = React.memo(({ className, seed = 0 }: { className?: string, seed?: number }) => {
    const random = useCallback((min: number, max: number) => { const x = Math.sin(seed + (className?.length ?? 0) * 10) * 10000; return min + (x - Math.floor(x)) * (max - min); }, [seed, className]);
    const duration1 = useRef(random(7, 10)).current;
    const duration2 = useRef(random(8, 11)).current;
    const duration3 = useRef(random(9, 12)).current;
    return (
        <motion.svg layout className={`w-full h-full bg-[var(--svg-bg)] ${className}`} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs> <linearGradient id={`grad-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%"> <motion.stop offset="0%" animate={{ stopColor: ['var(--svg-grad-1a)', 'var(--svg-grad-1b)', 'var(--svg-grad-1a)'] }} transition={{ duration: duration1 * 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} style={{ stopOpacity: 0.6 }} /> <motion.stop offset="100%" animate={{ stopColor: ['var(--svg-grad-2a)', 'var(--svg-grad-2b)', 'var(--svg-grad-2a)'] }} transition={{ duration: duration1 * 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} style={{ stopOpacity: 0.6 }} /> </linearGradient> <filter id={`blur-${seed}`}> <feGaussianBlur in="SourceGraphic" stdDeviation="3"/> </filter> </defs>
            <motion.rect width="100" height="100" fill={`url(#grad-${seed})`} />
            <motion.circle cx={random(20, 40)} cy={random(20, 40)} r={random(12, 18)} fill="rgba(255,255,255,0.15)" filter={`url(#blur-${seed})`} animate={{ cx: [random(20, 40), random(25, 45), random(20, 40)], cy: [random(20, 40), random(25, 45), random(20, 40)], scale: [1, 1.1, 1], }} transition={{ duration: duration1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
            <motion.rect x={random(55, 70)} y={random(50, 65)} width={random(25, 35)} height={random(25, 35)} fill="rgba(255,255,255,0.1)" filter={`url(#blur-${seed})`} style={{ originX: `${random(55, 70) + random(25, 35)/2}px`, originY: `${random(50, 65) + random(25, 35)/2}px` }} animate={{ rotate: [random(-10, 10), random(10, 30), random(-10, 10)], scale: [1, 0.95, 1], x: [random(55, 70), random(50, 65), random(55, 70)], }} transition={{ duration: duration2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
            <motion.path d={`M ${random(5, 15)} ${random(15, 25)} Q ${random(35, 45)} ${random(45, 55)} ${random(75, 85)} ${random(65, 75)}`} stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: duration3, repeat: Infinity, ease: 'easeInOut', delay: duration3 / 4 }} />
        </motion.svg>
    );
});
AbstractSvgPlaceholder.displayName = 'AbstractSvgPlaceholder';

const ChatNPTRoute = (router: ReturnType<typeof useRouter>) => {
    const localRedirectUrl = process.env.NEXT_PUBLIC_CHATNPT_URL;
    if (localRedirectUrl) {
        window.location.href = localRedirectUrl;
    } else {
        router.push('/ChatNPT');
    }
};

type InsightItem = {
    headline: string;
    category: string;
    summary: string;
    imageSeed?: number;
    link: string;
};

type InsightCardProps = {
    item: InsightItem;
    isLarge?: boolean;
    index: number;
};

const InsightCard = React.memo(({ item, isLarge = false, index }: InsightCardProps) => {
    const cardVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: index * 0.1 } },
        hover: { scale: 1.03, boxShadow: "var(--shadow-xl)", transition: { duration: 0.2 } }
    }), [index]);

    const contentOrderClass = isLarge && index % 2 !== 0 ? 'md:order-last' : ''; // Untuk mengubah urutan gambar dan teks pada kartu besar

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true, amount: 0.2 }}
            className={`bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden h-full flex flex-col group border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-all duration-300 ${isLarge ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}
        >
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                <div className={`flex ${isLarge ? 'flex-col md:flex-row' : 'flex-col'} h-full`}>
                    <div className={`overflow-hidden ${isLarge ? 'md:w-1/2 aspect-video md:aspect-auto' : 'aspect-video'} ${contentOrderClass}`}>
                        <motion.div
                            className="w-full h-full"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AbstractSvgPlaceholder className="object-cover w-full h-full" seed={item.imageSeed ?? index + 1} />
                        </motion.div>
                    </div>
                    <div className={`p-5 md:p-6 flex flex-col flex-grow ${isLarge ? 'md:w-1/2' : ''}`}>
                        <span className="text-xs text-[var(--color-secondary)] font-semibold uppercase tracking-wider mb-1">
                            {item.category}
                        </span>
                        <h3 className={`text-lg ${isLarge ? 'md:text-xl lg:text-2xl' : 'md:text-lg'} font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors duration-200`}>
                            {item.headline}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">
                            {item.summary}
                        </p>
                        <div className="mt-auto">
                            <span className="text-xs font-medium text-[var(--color-primary)] group-hover:underline flex items-center">
                                Read More <FiArrowRight className="ml-1.5 w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        </motion.div>
    );
});
InsightCard.displayName = 'InsightCard';

const insightItems: { large: InsightItem; small: InsightItem[] } = {
    large: {
        headline: "The Future of Generative AI: Trends & Predictions",
        category: "Deep Dive",
        summary: "Explore the evolving landscape of generative AI, from new model architectures to emerging applications that will shape the next decade.",
        imageSeed: 1,
        link: "#"
    },
    small: [
        {
            headline: "ChatNPT 1.0: Powering the Next Wave of AI Tools",
            category: "Technology",
            summary: "A closer look at the capabilities of ChatNPT 1.0 and how it's enabling developers to build smarter, more intuitive applications for free.",
            imageSeed: 2,
            link: "#"
        },
        {
            headline: "Ethical Considerations in AI Development",
            category: "Perspective",
            summary: "Our commitment to responsible AI: discussing the challenges and approaches to building fair, transparent, and accountable AI systems.",
            imageSeed: 3,
            link: "#"
        },
        {
            headline: "OpenGen Community Spotlight: Innovations & Creations",
            category: "Community",
            summary: "Highlighting inspiring projects and use cases developed by our vibrant community using OpenGen's free platform.",
            imageSeed: 4,
            link: "#"
        },
    ]
};
// ======================= END: INSIGHTS SECTION =======================


// ======================= START: NEW CARD COMPONENTS FOR SECTION 3 & 4 =======================
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

type ResearchCardItem = {
    icon: React.ElementType;
    title: string;
    description: string;
    link?: string;
    linkText?: string;
};
const ResearchCard = React.memo(({ item }: { item: ResearchCardItem }) => {
    const Icon = item.icon;
    return (
        <motion.div
            variants={fadeInUp}
            className="bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-all duration-300 group"
        >
            <div className="p-6 md:p-8 flex-grow">
                <div className="flex items-start mb-4">
                    <div className={`p-3 rounded-lg bg-[var(--accent-bg-light)] text-[var(--color-primary)] mr-4 flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
                        {item.title}
                    </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow min-h-[60px]">
                    {item.description}
                </p>
            </div>
            {item.link && (
                <div className="p-6 md:p-8 border-t border-[var(--border-color)] mt-auto bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-tertiary)] transition-colors duration-200">
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center"
                    >
                        {item.linkText || 'Learn More'} <FiArrowRight className="ml-1.5 w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                    </a>
                </div>
            )}
        </motion.div>
    );
});
ResearchCard.displayName = 'ResearchCard';

type OpenGenForEveryoneItem = {
    icon: React.ElementType;
    title: string;
    description: string;
    link?: string;
    linkText?: string;
};
const OpenForEveryoneCard = React.memo(({ item }: { item: OpenGenForEveryoneItem }) => {
    const Icon = item.icon;
    const router = useRouter(); // useRouter sudah ada, kita akan memanfaatkannya
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (item.link) {
            if (item.link === "/ChatNPT") { // Kondisi spesifik untuk /ChatNPT
                e.preventDefault(); // Mencegah navigasi default <a> tag
                ChatNPTRoute(router);
            } else if (item.link.startsWith('#')) { // Logika untuk anchor link tetap dipertahankan
                e.preventDefault();
                const sectionId = item.link.substring(1);
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <motion.div
            variants={fadeInUp}
            className="bg-[var(--card-bg)] rounded-2xl shadow-lg overflow-hidden p-6 md:p-8 border border-[var(--border-color)] hover:shadow-xl hover:border-[var(--color-primary)] transition-all duration-300 group flex flex-col h-full"
        >
            <div className={`mb-5 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-3 group-hover:text-[var(--color-primary)] transition-colors duration-200">
                {item.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 flex-grow min-h-[70px]">
                {item.description}
            </p>
            {item.link && (
                 <a
                    href={item.link}
                    onClick={handleLinkClick}
                    target={item.link.startsWith('#') || item.link === "/ChatNPT" ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="mt-auto text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center self-start"
                >
                    {item.linkText || "Explore"} <FiArrowRight className="ml-1.5 w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                </a>
            )}
        </motion.div>
    );
});
OpenForEveryoneCard.displayName = 'OpenForEveryoneCard';

// Data untuk Bagian 3 (Latest Research & Innovations)
const researchCardsData: ResearchCardItem[] = [
    {
        icon: FiCpu,
        title: "Introducing ChatNPT 1.5",
        description: "Our flagship model, offers state-of-the-art natural language understanding and generation. Completely free for everyone.",
        link: "#", 
        linkText: "Discover ChatNPT"
    },
    {
        icon: FiImage, // Menggunakan FiImage karena lebih relevan
        title: "Breakthrough in Multimodal AI",
        description: "ChatNPT now understands and generates not just text, but also images, with audio capabilities coming soon, opening new creative frontiers.",
        link: "#",
        linkText: "Explore Multimodal Features"
    },
    {
        icon: FiCheckCircle, // Menggunakan FiCheckCircle untuk etika/keamanan
        title: "Ethical AI Framework & Safety",
        description: "We are committed to responsible AI development. Explore our principles and safety measures designed for trustworthy and beneficial AI.",
        link: "#",
        linkText: "Our Safety Principles"
    },
    {
        icon: FiGithub,
        title: "Open Source & Community",
        description: "Fostering collaboration and innovation by contributing to the community with open models and tools. Join us in building the future of AI.",
        link: "https://github.com", // Contoh link eksternal
        linkText: "View on GitHub"
    }
];

// Data untuk Bagian 4 (OpenGen for Everyone)
const openGenForEveryoneData: OpenGenForEveryoneItem[] = [
    {
        icon: FiCode,
        title: "For Developers",
        description: "Integrate powerful AI into your applications with our simple, free API. Access cutting-edge models like ChatNPT without any cost.",
        link: "#api-section",
        linkText: "Access Free API"
    },
    {
        icon: FiPenTool,
        title: "For Creators & Writers",
        description: "Generate articles, scripts, and creative content. Overcome writer's block and explore new ideas with an AI partner that's always free.",
        link: "#demo-section",
        linkText: "See Live Demos"
    },
    {
        icon: FiBookOpen, // Menggunakan FiBookOpen untuk peneliti
        title: "For Researchers & Academics",
        description: "Utilize ChatNPT for data analysis, literature review, and hypothesis generation. Accelerate your research with powerful tools, free of charge.",
        link: "#", 
        linkText: "Discover Research Tools"
    },
    {
        icon: FiZap, // Menggunakan FiZap untuk dampak "Gratis & Terbuka"
        title: "Our Commitment: Free & Open Access",
        description: "We believe powerful AI should be accessible to all. ChatNPT are completely free, with no hidden fees or subscriptions, ever.",
        link: "/ChatNPT", // DIUBAH: Langsung ke halaman ChatNPT
        linkText: "Get Started For Free"
    }
];
// ======================= END: NEW CARD COMPONENTS FOR SECTION 3 & 4 =======================


const AnimatedNumber = React.memo(({ value }: { value: number }) => {
    const ref = useRef<HTMLSpanElement>(null); const isInView = useInView(ref, { once: true, margin: "-50px" }); const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => { if (isInView) { const controls = animate(0, value, { duration: 2, ease: "easeOut", onUpdate(latest) { setDisplayValue(Math.floor(latest)); } }); return () => { controls.stop(); }; } }, [isInView, value]);
    return <span ref={ref}>{displayValue.toLocaleString()}</span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const renderFormattedText = (text: string): React.ReactNode => {
    const boldParts = text.split('**');
    return boldParts.map((part, i) => {
        if (i % 2 === 1) { return <strong key={i}>{part}</strong>; }
        const codeParts = part.split('`');
        return codeParts.map((codePart, j) => {
            if (j % 2 === 1) { return <code key={`${i}-${j}`} className="inline-code">{codePart}</code>; }
            return <React.Fragment key={`${i}-${j}`}>{codePart}</React.Fragment>;
        });
    });
};

type ChatMessageSource = { speaker: 'user' | 'ai'; text: string; type?: 'text' | 'code'; thinkingSteps?: string[]; };
type DisplayedChatMessage = { id: number; speaker: 'user' | 'ai' | 'thinking'; text: string | string[]; type?: 'text' | 'code' | 'thinking'; fullText?: string; };
const ChatBubble = React.memo(({ message }: { message: DisplayedChatMessage }) => {
    const isUser = message.speaker === 'user';
    const isThinking = message.speaker === 'thinking';
    const isCode = message.type === 'code';
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isReasoningExpanded, setIsReasoningExpanded] = useState(true);
    const controlsRef = useRef<AnimationPlaybackControls | null>(null);

    const handleCopyCode = useCallback((code: string) => { navigator.clipboard.writeText(code).catch(err => console.error("Copy failed", err)); }, []);
    const bubbleVariants = useMemo(() => ({ hidden: { opacity: 0, y: 10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } } }), []);
    const reasoningStepVariants = useMemo(() => ({ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }), []);

    useEffect(() => {
        let isMounted = true;
        controlsRef.current?.stop();

        if (message.speaker === 'ai' && message.fullText && !isCode) {
            setDisplayedText('');
            setIsTyping(true);
            controlsRef.current = animate(0, message.fullText.length, {
                duration: message.fullText.length * 0.015,
                ease: "linear",
                onUpdate: (latest) => { if (isMounted) { setDisplayedText(message.fullText!.slice(0, Math.round(latest))); } },
                onComplete: () => { if (isMounted) { setIsTyping(false); setDisplayedText(message.fullText!); } }
            });
        } else if (typeof message.text === 'string') {
            setDisplayedText(message.text); setIsTyping(false);
        } else if (isThinking && Array.isArray(message.text)) {
            setIsTyping(false);
        } else {
            setDisplayedText('');
            setIsTyping(false);
        }
        return () => { isMounted = false; controlsRef.current?.stop(); };
    }, [message.id, message.speaker, message.fullText, message.text, isCode, isThinking]);

    const codeBlock = isCode && typeof message.text === 'string' ? message.text : null;
    const reasoningSteps = Array.isArray(message.text) && isThinking ? message.text : [];

    return (
        <motion.div layout="position" variants={bubbleVariants} initial="hidden" animate="visible" className={`flex items-end gap-2.5 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && !isThinking && <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0 mb-1"> <FiCpu className="w-5 h-5 text-[var(--color-secondary)]"/> </div>}
            {isThinking && <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center flex-shrink-0 mb-1"> <FiEye className="w-5 h-5 text-[var(--text-tertiary)]"/> </div>}
            <motion.div layout className={`relative max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${isUser ? 'bg-[var(--color-primary)] text-white rounded-br-none' : isThinking ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-bl-none' : 'bg-[var(--card-bg)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)]'}`}>
                {codeBlock ? ( <div className="relative group"> <pre className="text-xs font-mono overflow-x-auto p-3 bg-[var(--code-bg)] text-[var(--code-text)] rounded my-1 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)] max-h-60"> <code>{codeBlock}</code> </pre> <button onClick={() => handleCopyCode(codeBlock)} className="absolute top-1 right-1 p-1 bg-[var(--bg-tertiary)] rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--color-primary)]" title="Copy code"> <FiCopy className="w-3 h-3"/> </button> </div>
                ) : isThinking ? ( <div className="text-sm"> <div className="flex justify-between items-center mb-2"> <p className="font-medium text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Thinking Process</p> <motion.button onClick={() => setIsReasoningExpanded(!isReasoningExpanded)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" title={isReasoningExpanded ? "Hide steps" : "Show steps"} whileTap={{scale:0.9}}> {isReasoningExpanded ? <FiEyeOff className="w-3.5 h-3.5"/> : <FiEye className="w-3.5 h-3.5"/>} </motion.button> </div> <AnimatePresence initial={false}> {isReasoningExpanded && ( <motion.ul layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', transition: { staggerChildren: 0.08, delayChildren: 0.1 } }} exit={{ opacity: 0, height: 0 }} className="list-none pl-0 space-y-1.5 overflow-hidden" > {reasoningSteps.map((step, i) => step.trim() && ( <motion.li key={i} variants={reasoningStepVariants} initial="hidden" animate="visible" exit="hidden" className="flex items-start gap-2"> <FiZap className="w-3 h-3 mt-0.5 text-[var(--color-warning)] flex-shrink-0"/> <span>{renderFormattedText(step)}</span> </motion.li> ))} </motion.ul> )} </AnimatePresence> </div>
                ) : ( <p className="text-sm whitespace-pre-wrap break-words min-h-[1em]"> {renderFormattedText(displayedText)} {isTyping && <motion.span className="inline-block w-1 h-4 bg-[var(--text-primary)] ml-px align-bottom" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} />} </p> )}
            </motion.div>
            {isUser && <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0 mb-1"> <FiUsers className="w-5 h-5 text-[var(--color-primary)]"/> </div>}
        </motion.div>
    );
});
ChatBubble.displayName = 'ChatBubble';

// demoScenarios dan apiCodeExample (Bagian 5 & 6) dipertahankan
const demoScenarios: { id: number; title: string; messages: ChatMessageSource[]; hasReasoning?: boolean; reasoningSteps?: string[]; }[] = [
    { id: 1, title: "Complex Code Gen", messages: [{ speaker: 'user', text: 'Generate a Python class `BankAccount` with methods for deposit, withdrawal (checking balance), and getting the balance. Include docstrings and basic error handling using `decimal` for precision.' }, { speaker: 'ai', text: '```python\nimport decimal\n\nclass BankAccount:\n    """Represents a simple bank account with deposit and withdrawal features."""\n\n    def __init__(self, initial_balance=0):\n        """Initializes the account with a given balance."""\n        try:\n            self._balance = decimal.Decimal(initial_balance)\n            if self._balance < 0:\n                raise ValueError("Initial balance cannot be negative")\n        except decimal.InvalidOperation:\n            raise ValueError("Initial balance must be a valid number")\n\n    def deposit(self, amount):\n        """Deposits a positive amount into the account."""\n        try:\n            deposit_amount = decimal.Decimal(amount)\n            if deposit_amount <= 0:\n                print("Error: Deposit amount must be positive.")\n                return False\n            self._balance += deposit_amount\n            print(f"Deposit successful. New balance: ${self._balance:.2f}")\n            return True\n        except decimal.InvalidOperation:\n            print("Error: Invalid deposit amount.")\n            return False\n\n    def withdraw(self, amount):\n        """Withdraws a positive amount if sufficient funds exist."""\n        try:\n            withdraw_amount = decimal.Decimal(amount)\n            if withdraw_amount <= 0:\n                print("Error: Withdrawal amount must be positive.")\n                return False\n            if withdraw_amount > self._balance:\n                print(f"Error: Insufficient funds. Balance: ${self._balance:.2f}")\n                return False\n            self._balance -= withdraw_amount\n            print(f"Withdrawal successful. New balance: ${self._balance:.2f}")\n            return True\n        except decimal.InvalidOperation:\n            print("Error: Invalid withdrawal amount.")\n            return False\n\n    def get_balance(self):\n        """Returns the current account balance."""\n        return self._balance\n\n    def __str__(self):\n        """String representation of the account balance."""\n        return f"Account Balance: ${self.get_balance():.2f}"\n```\nThis class uses the `decimal` module for accurate financial calculations and includes basic validation.', type: 'code' }] },
    { id: 2, title: "Creative Scenario", messages: [{ speaker: 'user', text: 'Write a short, atmospheric paragraph setting the scene for a mystery story in an old library at midnight.' }, { speaker: 'ai', text: 'Midnight clung heavy in the air of the Blackwood Library, thick with the scent of aging paper and forgotten secrets. Moonlight, fractured by the tall gothic windows, cast long, skeletal shadows from the towering bookshelves, turning familiar aisles into a labyrinth of whispers. The only sound was the deliberate **tick-tock** of the grandfather clock in the main hall, each pendulum swing echoing like a slow heartbeat in the profound silence. A faint draft stirred the dust motes dancing in the silver beams, carrying with it the unsettling feeling of being watched from the darkness between the leather-bound spines.' }] },
    { id: 3, title: "Logic Puzzle (Reasoning)", hasReasoning: true, reasoningSteps: ["Objective: Determine who has which pet and lives where.", "Clue 1: The `cat` owner lives in the `Blue` house.", "Clue 2: `Sarah` owns the `Dog`.", "Clue 3: `Mark` does **not** live in the `Red` house.", "Clue 4: The person in the `Green` house owns the `Bird`.", "Deduction 1 (from Clue 2): Sarah has the Dog. She can\'t own the Cat or Bird.", "Deduction 2 (from Clue 1 & D1): The Blue house resident has the Cat. This **cannot** be Sarah.", "Deduction 3 (from Clue 4 & D1): The Green house resident has the Bird. This also **cannot** be Sarah.", "Deduction 4 (from D1, D2, D3): Since Sarah doesn\'t live in Blue or Green, she **must** live in the `Red` house with her `Dog`.", "Deduction 5 (from Clue 3 & D4): Mark doesn\'t live in Red (Sarah\'s house).", "Deduction 6 (from Clue 1 & D5): Mark also doesn\'t live in Blue (Cat owner\'s house).", "Deduction 7 (from D5, D6): By elimination, Mark **must** live in the `Green` house.", "Deduction 8 (from Clue 4 & D7): Since Mark is in the Green house, he owns the `Bird`.", "Deduction 9 (Elimination): The only person left is `Lisa`, the only pet left is the `Cat`, and the only house left is `Blue`. Lisa **must** live in the `Blue` house with the `Cat`.", "Final Check: Lisa/Cat/Blue matches Clue 1. Sarah/Dog matches Clue 2. Mark not in Red matches Clue 3. Mark/Bird/Green matches Clue 4. All consistent."], messages: [{ speaker: 'user', text: 'Alice, Bob, Charles, and David ran a race. Alice finished before Charles. Bob finished after David. Charles finished immediately after Bob. What was the finishing order?' }, { speaker: 'ai', text: 'Based on the clues:\n1. From `"Charles finished immediately after Bob"`, we know the sequence: **... Bob -> Charles ...**\n2. From `"Alice finished before Charles"`, Alice must be somewhere before Charles in that sequence.\n3. From `"Bob finished after David"`, David must be before Bob.\n4. Combining these: **David -> Bob -> Charles**.\n5. Since Alice finished before Charles, and the spots before Charles are taken, she must be last.\n\nTherefore, the finishing order was: **David, Bob, Charles, Alice**.' }] },
    { id: 4, title: "Comparative Analysis (Reasoning)", hasReasoning: true, reasoningSteps: ["Compare: Learning `Guitar` vs `Piano` for beginners.", "Factor - Physicality: Guitar requires finger strength/calluses initially -> steep physical curve. Piano requires hand coordination/independence.", "Factor - Theory/Layout: Piano layout aids visual understanding of scales/chords. Guitar fretboard requires learning patterns/shapes.", "Factor - Cost: Entry-level guitars often cheaper than entry-level keyboards/pianos.", "Factor - Portability: Guitars are generally very portable.", "Factor - Versatility: Both are highly versatile across genres.", "Conclusion: Trade-offs exist. Piano: easier theory start, good for harmony. Guitar: portable, cheaper start, initial physical challenge."], messages: [{ speaker: 'user', text: 'Briefly compare the pros and cons of learning guitar versus learning piano for a complete beginner.' }, { speaker: 'ai', text: 'Choosing between `guitar` and `piano` as a beginner involves trade-offs:\n\n* **Initial Difficulty:**\n    * *Guitar:* Can have a steeper initial physical hurdle (finger pain, calluses, complex chord shapes).\n    * *Piano:* Layout is visually logical. Initial coordination between two hands can be tricky.\n* **Playing Chords/Melody:**\n    * *Guitar:* Strumming basic chords is relatively quick. Playing melodies or complex fingerstyle takes more dexterity.\n    * *Piano:* Easier to play chords and melody simultaneously early on.\n* **Portability:** Guitar is **highly portable**; acoustic pianos are not.\n* **Cost:** Decent beginner guitars are **often cheaper** than decent beginner digital pianos.\n* **Versatility:** Both are extremely versatile across genres.\n\n**In short:** Piano might feel more intuitive initially for theory, while guitar is more portable and potentially cheaper to start, but might require more initial physical persistence.' }] },
    { id: 5, title: "Summarize & Extract", messages: [{ speaker: 'user', text: 'Please summarize this and extract the main technologies mentioned: "Quantum computing leverages principles like superposition and entanglement to perform calculations exponentially faster than classical computers for specific problems. Key hardware approaches include superconducting qubits, trapped ions, and photonic systems. While still nascent, potential applications span drug discovery, materials science, and complex optimization."' }, { speaker: 'ai', text: '**Summary:**\nQuantum computing uses unique quantum phenomena (`superposition`, `entanglement`) offering potential for massive speedups over classical computers for certain problems. Major hardware types being explored are `superconducting qubits`, `trapped ions`, and `photonics`. Although early-stage, it has promising applications in areas like `drug discovery`, `materials science`, and `optimization`.\n\n**Key Technologies/Concepts Mentioned:**\n- Quantum computing\n- Superposition\n- Entanglement\n- Classical computers\n- Superconducting qubits\n- Trapped ions\n- Photonic systems' }] },
];
const apiCodeExample: string = `import requests
import json

API_ENDPOINT = "https://api.opengen.mock/v1/generate" 
# No API Key needed for OpenGen - it's free!

headers = {
    "Content-Type": "application/json"
}

data = {
    "prompt": "Write a short poem about the moon.",
    "model": "chatnpt-1.0", # Specify the model
    "max_tokens": 50
}

response = requests.post(API_ENDPOINT, headers=headers, data=json.dumps(data))

if response.status_code == 200:
    print(response.json()['choices'][0]['text'])
else:
    print(f"Error: {response.status_code} - {response.text}")`;


export default function HomePage() {
    const [isHydrated, setIsHydrated] = useState(false);
    const [theme, setTheme] = useState('light');
    const [activeDemoTab, setActiveDemoTab] = useState<number>(demoScenarios[0].id);
    const [displayedMessages, setDisplayedMessages] = useState<DisplayedChatMessage[]>([]);
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);
    const [currentDemoIndex, setCurrentDemoIndex] = useState<number>(0);
    const [isRunningDemo, setIsRunningDemo] = useState(false);
    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);

    const insightsRef = useRef<HTMLElement>(null);
    const researchRef = useRef<HTMLElement>(null); // New ref for Research Section
    const openGenForEveryoneRef = useRef<HTMLElement>(null); // New ref for OpenGen For Everyone Section
    const demoRef = useRef<HTMLElement>(null);
    const apiRef = useRef<HTMLElement>(null);
    const ctaRef = useRef<HTMLElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const demoTimeouts = useRef<NodeJS.Timeout[]>([]);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    
    const applyThemeVariables = useCallback((selectedTheme: string) => {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;
        const vars = selectedTheme === 'dark' ? { '--bg-primary': '#0f172a', '--bg-secondary': '#1e293b', '--bg-tertiary': '#334155', '--card-bg': '#1e293b', '--accent-bg-light': 'rgba(59, 130, 246, 0.15)', '--svg-bg': '#334155', '--text-primary': '#f1f5f9', '--text-secondary': '#cbd5e1', '--text-tertiary': '#94a3b8', '--text-on-primary-bg': '#f1f5f9', '--text-on-accent-bg': '#60a5fa', '--border-color': '#334155', '--border-color-hover': '#475569', '--button-bg': '#334155', '--button-hover-bg': '#475569', '--button-secondary-bg': '#475569', '--button-secondary-text': '#f1f5f9', '--button-secondary-hover-bg': '#59677c', '--color-primary': '#60a5fa', '--color-secondary': '#a78bfa', '--color-success': '#34d399', '--color-warning': '#f59e0b', '--color-error': '#f43f5e', '--cta-glow-color': 'rgba(96, 165, 250, 0.4)', '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.1)', '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.1)', '--shadow-xl': '0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)', '--svg-grad-1a': 'rgb(96, 165, 250)', '--svg-grad-1b': 'rgb(167, 139, 250)', '--svg-grad-2a': 'rgb(192, 132, 252)', '--svg-grad-2b': 'rgb(59, 130, 246)', '--code-bg': '#0f172a', '--code-text': '#cbd5e1', '--scrollbar-thumb': '#475569', '--scrollbar-track': '#1e293b', '--bg-secondary-translucent': 'rgba(30, 41, 59, 0.7)', '--inline-code-bg': 'rgba(51, 65, 85, 0.5)', '--inline-code-text': '#e2e8f0', '--inline-code-border': '#475569', '--overlay-bg': 'rgba(15, 23, 42, 0.8)' }
                                        : { '--bg-primary': '#ffffff', '--bg-secondary': '#f8fafc', '--bg-tertiary': '#f1f5f9', '--card-bg': '#ffffff', '--accent-bg-light': '#e0f2fe', '--svg-bg': '#f1f5f9', '--text-primary': '#0f172a', '--text-secondary': '#475569', '--text-tertiary': '#64748b', '--text-on-primary-bg': '#0f172a', '--text-on-accent-bg': '#0284c7', '--border-color': '#e2e8f0', '--border-color-hover': '#cbd5e1', '--button-bg': '#ffffff', '--button-hover-bg': '#f1f5f9', '--button-secondary-bg': '#f1f5f9', '--button-secondary-text': '#334155', '--button-secondary-hover-bg': '#e2e8f0', '--color-primary': '#3b82f6', '--color-secondary': '#8b5cf6', '--color-success': '#10b981', '--color-warning': '#f59e0b', '--color-error': '#ef4444', '--cta-glow-color': 'rgba(59, 130, 246, 0.3)', '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)', '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.04)', '--shadow-xl': '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.04)', '--svg-grad-1a': 'rgb(96, 165, 250)', '--svg-grad-1b': 'rgb(167, 139, 250)', '--svg-grad-2a': 'rgb(192, 132, 252)', '--svg-grad-2b': 'rgb(59, 130, 246)', '--code-bg': '#f1f5f9', '--code-text': '#1e293b', '--scrollbar-thumb': '#cbd5e1', '--scrollbar-track': '#f8fafc', '--bg-secondary-translucent': 'rgba(255, 255, 255, 0.7)', '--inline-code-bg': 'rgba(226, 232, 240, 0.5)', '--inline-code-text': '#0f172a', '--inline-code-border': '#e2e8f0', '--overlay-bg': 'rgba(248, 250, 252, 0.8)' };
        Object.entries(vars).forEach(([key, value]) => { root.style.setProperty(key, value); });
    }, []);

    useEffect(() => {
        const initialTheme = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        setTheme(initialTheme);
        applyThemeVariables(initialTheme);
        setIsHydrated(true);
    }, [applyThemeVariables]);

    useEffect(() => {
        if (!isHydrated) return;
        const videoElement = videoRef.current;
        if (videoElement) {
            const handlePlay = () => setIsVideoPlaying(true);
            const handlePause = () => setIsVideoPlaying(false);
            const handleEnded = () => setIsVideoPlaying(false); 
            videoElement.addEventListener('play', handlePlay);
            videoElement.addEventListener('pause', handlePause);
            videoElement.addEventListener('ended', handleEnded);
            if (isVideoPlaying && videoElement.paused) {
                videoElement.play().catch(error => {
                    console.warn("Video autoplay was prevented on mount/hydration:", error);
                    setIsVideoPlaying(false); 
                });
            } else if (!isVideoPlaying && !videoElement.paused) {
                videoElement.pause();
            }
            return () => {
                videoElement.removeEventListener('play', handlePlay);
                videoElement.removeEventListener('pause', handlePause);
                videoElement.removeEventListener('ended', handleEnded);
            };
        }
    }, [isHydrated, isVideoPlaying]);

    useEffect(() => { if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; } }, [displayedMessages, showTypingIndicator]);
    useEffect(() => { return () => { demoTimeouts.current.forEach(clearTimeout); }; }, []);

    const runDemo = useCallback((demoIndex: number) => {
        setIsRunningDemo(true);
        demoTimeouts.current.forEach(clearTimeout);
        demoTimeouts.current = [];
        setDisplayedMessages([]);
        setShowTypingIndicator(false);
        setCurrentDemoIndex(demoIndex);

        const demo = demoScenarios[demoIndex];
        if (!demo) { setIsRunningDemo(false); return; }

        let currentDelay = 0;
        let messageCounter = 0;
        const interMessageDelay = 300;
        const typingIndicatorDelay = 500;
        const reasoningDisplayTime = 1800;
        const postReasoningPause = 500;

        demo.messages.forEach((msg, i) => {
            const messageId = messageCounter++;
            const showReasoningNext = demo.hasReasoning && msg.speaker === 'user' && i === 0;

            currentDelay += interMessageDelay;
            const messageTimeout = setTimeout(() => {
                if (msg.speaker === 'ai') setShowTypingIndicator(false);
                setDisplayedMessages(prev => [...prev, { ...msg, id: messageId, fullText: msg.text }]);
            }, currentDelay);
            demoTimeouts.current.push(messageTimeout);

            const nextSpeakerIsAI = demo.messages[i + 1]?.speaker === 'ai';

            if (showReasoningNext && demo.reasoningSteps) {
                currentDelay += typingIndicatorDelay;
                const typingTimeout1 = setTimeout(() => { setShowTypingIndicator(true); }, currentDelay);
                demoTimeouts.current.push(typingTimeout1);
                currentDelay += 500; 
                const reasoningTimeout = setTimeout(() => {
                    setShowTypingIndicator(false);
                    setDisplayedMessages(prev => [...prev, { id: messageCounter++, speaker: 'thinking', text: demo.reasoningSteps ?? [], type: 'thinking' }]);
                }, currentDelay);
                demoTimeouts.current.push(reasoningTimeout);
                currentDelay += reasoningDisplayTime;
                if (nextSpeakerIsAI) {
                    const typingTimeout2 = setTimeout(() => { setShowTypingIndicator(true); }, currentDelay);
                    demoTimeouts.current.push(typingTimeout2);
                    currentDelay += postReasoningPause;
                }
            } else if (nextSpeakerIsAI) {
                currentDelay += typingIndicatorDelay;
                const typingTimeout3 = setTimeout(() => { setShowTypingIndicator(true); }, currentDelay);
                demoTimeouts.current.push(typingTimeout3);
            }
        });
        const finalTimeout = setTimeout(() => { setIsRunningDemo(false); setShowTypingIndicator(false); }, currentDelay + 1000);
        demoTimeouts.current.push(finalTimeout);
    }, []);

    useEffect(() => { runDemo(0); }, [runDemo]);

    const handleDemoTabClick = useCallback((id: number) => {
        const index = demoScenarios.findIndex(d => d.id === id);
        if (index !== -1 && !isRunningDemo) { setActiveDemoTab(id); runDemo(index); }
    }, [runDemo, isRunningDemo]);

    const toggleTheme = useCallback(() => { setTheme(prevTheme => { const newTheme = prevTheme === 'light' ? 'dark' : 'light'; localStorage.theme = newTheme; applyThemeVariables(newTheme); return newTheme; }); }, [applyThemeVariables]);

    const handleSubmit = useCallback((optionalPrompt?: string) => {
        const promptToUse = optionalPrompt || localStorage.getItem('initialPrompt') || "";
        if (promptToUse.trim()) {
            localStorage.setItem('initialPrompt', promptToUse.trim());
        }
        ChatNPTRoute(router);
    }, [router]);

    const scrollToSection = useCallback((id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);
    const handleGetStartedClick = useCallback(() => { handleSubmit(); }, [handleSubmit]);

    const headingContainerVariants = useMemo(() => ({ hidden: { opacity: 0 }, visible: (i = 1) => ({ opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.3 * i }, }), }), []);
    const headingLetterVariants = useMemo(() => ({ hidden: { opacity: 0, y: 20, rotateX: -45 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", damping: 15, stiffness: 150 } }, }), []);
    const fadeIn = useMemo(() => ({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } }), []);
    // fadeInUp sudah didefinisikan di atas (global untuk card)
    const staggerContainer = useMemo(() => ({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }), []);
    const sectionVariants = useMemo(() => ({ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }, }), []);
    const ctaButtonVariants = useMemo(() => ({
        hover: { scale: 1.05, boxShadow: "0 0 25px var(--cta-glow-color)" }, // Sedikit lebih intens glow
        tap: { scale: 0.95 },
        pulse: { scale: [1, 1.03, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }
    }), []);
    const heroCtaButtonVariants = useMemo(() => ({
        initial: { opacity: 0.8, y: 10 },
        visible: { opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.5 } },
        hover: { scale: 1.05, opacity: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', boxShadow: "0 0 15px rgba(255,255,255,0.3)" },
        tap: { scale: 0.95 },
        pulse: { scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 } }
    }), []);

    const toggleVideoPlay = useCallback(() => {
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(error => {
                    console.warn("Video play error on toggle:", error);
                    setIsVideoPlaying(false);
                });
            }
        }
    }, [isVideoPlaying]);

    return (
        <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-300 font-sans`}> {/* Menggunakan font-sans default Tailwind */}
            <style jsx global>{`
                body { font-family: 'Inter', sans-serif; } /* Pastikan Inter dimuat jika digunakan secara eksplisit */
                .inline-code { background-color: var(--inline-code-bg); color: var(--inline-code-text); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.875em; border: 1px solid var(--inline-code-border); font-family: monospace; word-wrap: break-word; }
                .scrollbar-thin { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track); }
                .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: var(--scrollbar-track); border-radius: 4px;}
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb); border-radius: 4px; border: 2px solid var(--scrollbar-track); }
                .text-shadow-md { text-shadow: 0 2px 4px rgba(0,0,0,0.3); } /* Definisi text-shadow jika diperlukan */
            `}</style>
            <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] z-[60]" style={{ scaleX, transformOrigin: "0%" }} />
            <motion.button onClick={toggleTheme} className="fixed bottom-5 right-5 z-[60] p-3 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shadow-lg" whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} > {theme === 'light' ? <FiMoon className="w-5 h-5"/> : <FiSun className="w-5 h-5"/>} </motion.button>
            <Navbar />

            {/* ======================= START: HERO SECTION (REFINED MINIMALIST) ======================= */}
            <motion.section
                className="relative flex flex-col h-screen min-h-[600px] overflow-hidden" // min-h untuk fallback jika screen terlalu kecil
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
            >
                {isHydrated && (
                    <video
                        ref={videoRef}
                        src="/demo.mp4" // PASTIKAN VIDEO INI ADA DI /public/demo.mp4
                        className="absolute top-0 left-0 w-full h-full object-cover z-0"
                        autoPlay
                        loop
                        muted
                        playsInline // Penting untuk autoplay di iOS
                        preload="auto" // preload="auto" atau "metadata"
                        onCanPlay={() => {
                            if (videoRef.current && videoRef.current.paused && isVideoPlaying) {
                                videoRef.current.play().catch(e => console.warn("Retry play failed onCanPlay", e));
                            }
                        }}
                    />
                )}
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-[1]"></div> {/* Overlay gelap untuk kontras teks */}
                
                <div className="relative z-[2] flex flex-col items-center justify-center text-center px-4 text-white w-full h-full pt-[60px] md:pt-[70px] pb-10 md:pb-16"> {/* Navbar height: mobile 60px, desktop 70px */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                        className="max-w-2xl lg:max-w-3xl"
                    >
                        <motion.h1
                            variants={headingContainerVariants}
                            custom={0.3}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 sm:mb-6 leading-tight" // Ukuran font disesuaikan, leading-tight
                        >
                            {"OpenGen".split('').map((char, index) => (
                                <motion.span key={`title-main-${index}`} variants={headingLetterVariants} className="inline-block">
                                    {char === ' ' ? '\u00A0' : char}
                                </motion.span>
                            ))}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="text-lg sm:text-xl md:text-2xl text-gray-200 dark:text-gray-300 mb-10 sm:mb-12"
                        >
                            Create, Innovate, Explore. <strong className="text-gray-100">Completely Free.</strong>
                        </motion.p>
                        
                        <motion.button
                            onClick={() => handleSubmit()}
                            variants={heroCtaButtonVariants}
                            initial="initial"
                            animate={["visible", "pulse"]} // Menjalankan visible dan pulse
                            whileHover="hover"
                            whileTap="tap"
                            className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 rounded-lg text-base sm:text-lg transition-all duration-300 ease-in-out flex items-center justify-center mx-auto group"
                        >
                            Go To ChatNPT
                            <FiArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </motion.button>
                    </motion.div>
                </div>

                {isHydrated && (
                    <motion.button
                        onClick={toggleVideoPlay}
                        className="absolute bottom-6 left-6 z-[5] p-3 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-sm transition-all duration-200 shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={isVideoPlaying ? "Pause Video" : "Play Video"}
                        aria-label={isVideoPlaying ? "Pause Video" : "Play Video"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.4 }}
                    >
                        {isVideoPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
                    </motion.button>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-[5] cursor-pointer group"
                    onClick={() => scrollToSection('news-section')} // Mengarahkan ke section berikutnya
                    title="Scroll to Explore More"
                >
                    <motion.span
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <FiArrowDown className="h-5 w-5 mb-1 group-hover:text-[var(--color-primary)] transition-colors" />
                    </motion.span>
                    <span className="text-xs group-hover:text-[var(--color-primary)] transition-colors">Explore More</span>
                </motion.div>
            </motion.section>
            {/* ======================== END: HERO SECTION (REFINED MINIMALIST) ======================== */}


            <motion.section 
                ref={insightsRef} 
                id="insights-section" 
                className="bg-[var(--bg-secondary)] py-16 md:py-24 overflow-hidden" 
                variants={sectionVariants} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.1 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true, amount: 0.3 }} 
                        variants={staggerContainer}
                        className="text-center mb-12 md:mb-16"
                    >
                        <motion.h2 
                            variants={fadeInUp} 
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4"
                        >
                            Spotlight & Insights
                        </motion.h2>
                        <motion.p 
                            variants={fadeInUp} 
                            transition={{delay:0.1}}
                            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto"
                        >
                            Discover the latest articles, research highlights, and community stories from OpenGen.
                        </motion.p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        <InsightCard item={insightItems.large} isLarge index={0} />
                        {insightItems.small.map((item, index) => (
                            <InsightCard key={item.headline + index} item={item} index={index + 1} />
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ======================= START: SECTION 3 (NEW - Latest Research & Innovations) ======================= */}
            <motion.section 
                ref={researchRef} 
                id="research-section" 
                className="py-16 md:py-24 bg-[var(--bg-primary)]" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.1 }} 
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 
                        variants={fadeInUp} 
                        className="text-3xl md:text-4xl font-bold text-center text-[var(--text-primary)] mb-5"
                    >
                        Latest Research & Innovations
                    </motion.h2>
                    <motion.p 
                        variants={fadeInUp} 
                        transition={{delay: 0.1}} 
                        className="text-lg text-[var(--text-secondary)] text-center mb-12 md:mb-16 max-w-2xl mx-auto"
                    >
                        Discover the breakthroughs and principles that drive ChatNPT.
                    </motion.p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-10"> {/* Diubah menjadi 2 kolom untuk kartu yang lebih besar */}
                        {researchCardsData.map((item, index) => (
                            <ResearchCard key={index} item={item} />
                        ))}
                    </div>
                </div>
            </motion.section>
            {/* ======================= END: SECTION 3 (NEW - Latest Research & Innovations) ======================= */}

            {/* ======================= START: SECTION 4 (NEW - OpenGen for Everyone) ======================= */}
            <motion.section 
                ref={openGenForEveryoneRef} 
                id="for-everyone-section" 
                className="py-16 md:py-24 bg-[var(--bg-secondary)]" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.1 }} 
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 
                        variants={fadeInUp} 
                        className="text-3xl md:text-4xl font-bold text-center text-[var(--text-primary)] mb-5"
                    >
                        OpenGen for Everyone
                    </motion.h2>
                    <motion.p 
                        variants={fadeInUp} 
                        transition={{delay: 0.1}} 
                        className="text-lg text-[var(--text-secondary)] text-center mb-12 md:mb-16 max-w-2xl mx-auto"
                    >
                        Explore how OpenGen's free and powerful AI tools can benefit various fields and users.
                    </motion.p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"> {/* Diubah menjadi 4 kolom untuk kartu yang lebih ringkas */}
                        {openGenForEveryoneData.map((item, index) => (
                            <OpenForEveryoneCard key={index} item={item} />
                        ))}
                    </div>
                </div>
            </motion.section>
            {/* ======================= END: SECTION 4 (NEW - OpenGen for Everyone) ======================= */}
            
            {/* Bagian 5: Demo Section - TIDAK BERUBAH */}
            <motion.section ref={demoRef} id="demo-section" className="py-16 md:py-24 bg-[var(--bg-primary)]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-4xl font-semibold text-center text-[var(--text-primary)] mb-4">See OpenGen in Action</motion.h2>
                    <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay: 0.1}} className="text-lg text-[var(--text-secondary)] text-center mb-12 md:mb-16 max-w-2xl mx-auto">Select a scenario to watch a simulated interaction with ChatNPT.</motion.p>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8"> {demoScenarios.map((demo, index) => ( <motion.button key={demo.id} onClick={() => handleDemoTabClick(demo.id)} variants={fadeIn} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border ${ activeDemoTab === demo.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md' : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-color-hover)]'}`} disabled={isRunningDemo} > {demo.title} </motion.button> ))} </div>
                    <motion.div layout variants={fadeInUp} transition={{delay: 0.2}} className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-4 md:p-6 min-h-[400px] max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)] flex flex-col" ref={chatContainerRef}>
                        <AnimatePresence initial={false}> {displayedMessages.map((message) => ( <ChatBubble key={message.id} message={message} /> ))} </AnimatePresence>
                        <AnimatePresence> {showTypingIndicator && ( <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="flex items-center gap-2 my-3 justify-start"> <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0"> <FiCpu className="w-5 h-5 text-[var(--color-secondary)]"/> </div> <div className="flex space-x-1 p-3"> <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}/> <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}/> <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}/> </div> </motion.div> )} </AnimatePresence>
                        {!isRunningDemo && displayedMessages.length > 0 && <div className="flex-grow"></div>}
                    </motion.div>
                    <motion.button onClick={() => runDemo(currentDemoIndex)} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay: 0.3}} whileHover={{y:-2}} whileTap={{scale:0.95}} className="mt-6 mx-auto block text-sm text-[var(--color-primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1" disabled={isRunningDemo}> <FiRefreshCw className={`w-4 h-4 ${isRunningDemo ? 'animate-spin' : ''}`}/> Run Demo Again </motion.button>
                </div>
            </motion.section>

            {/* Bagian 6: API Section - TIDAK BERUBAH (kecuali info API Key) */}
            <motion.section ref={apiRef} id="api-section" className="py-16 md:py-24 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div variants={fadeInUp}>
                            <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)] mb-4">Build with the OpenGen API</motion.h2>
                            <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay:0.1}} className="text-lg text-[var(--text-secondary)] mb-6">Integrate the power of ChatNPT into your own applications and workflows. Our REST API is simple, powerful, and <strong className="text-[var(--color-success)]">completely free to use.</strong></motion.p>
                            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay:0.2}} className="flex flex-wrap gap-4 mb-6">
                                <motion.a href="#" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[var(--color-primary)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"> <FiBookOpen className="w-5 h-5 mr-2"/> API Documentation </motion.a>
                                <motion.a href="#" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center px-6 py-3 border border-[var(--border-color)] text-base font-medium rounded-md text-[var(--text-secondary)] bg-[var(--button-bg)] hover:bg-[var(--button-hover-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"> <FiGithub className="w-5 h-5 mr-2"/> Developer Community </motion.a>
                            </motion.div>
                            <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay:0.3}} className="text-sm text-[var(--text-tertiary)]">
                                No API key required for standard use. Just start building!
                            </motion.p>
                        </motion.div>
                        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay: 0.1}} className="relative group">
                             <pre className="text-xs font-mono overflow-x-auto p-4 md:p-6 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg shadow-lg border border-[var(--border-color)] scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]"> <code>{apiCodeExample}</code> </pre>
                             <button onClick={() => navigator.clipboard.writeText(apiCodeExample)} className="absolute top-2 right-2 p-1.5 bg-[var(--bg-tertiary)] rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--color-primary)]" title="Copy code"> <FiCopy className="w-4 h-4"/> </button>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Bagian 7: CTA Section - Minor text update */}
            <motion.section ref={ctaRef} id="cta-section" className="py-20 md:py-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white relative overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} >
                <motion.div className="absolute inset-0 z-0" style={{ overflow: 'hidden' }}> <motion.div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full filter blur-3xl opacity-50" animate={{ x: [-100, 100, -100], y: [-50, 50, -50], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }} /> <motion.div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full filter blur-3xl opacity-50" animate={{ x: [100, -100, 100], y: [50, -50, 50], scale: [1, 0.8, 1] }} transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}/> </motion.div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} className="flex flex-wrap justify-center gap-8 md:gap-16 mb-10"> <div className="text-center"> <p className="text-4xl md:text-5xl font-bold text-white"><AnimatedNumber value={100000} />+</p> <p className="text-sm text-blue-100 mt-1">Happy Free Users</p> </div> <div className="text-center"> <p className="text-4xl md:text-5xl font-bold text-white"><AnimatedNumber value={99} />%</p> <p className="text-sm text-blue-100 mt-1">Satisfaction Rate</p> </div> <div className="text-center"> <p className="text-4xl md:text-5xl font-bold text-white"><AnimatedNumber value={100} />%</p> <p className="text-sm text-blue-100 mt-1">Free Access</p> </div> </motion.div>
                    <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-4xl font-bold mb-6" > Get Started with OpenGen Today </motion.h2>
                    <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay: 0.1}} className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto" > Experience the future of AI-powered creation and problem-solving with ChatNPT. <strong className="text-white">It's completely free, no subscriptions, no hidden costs.</strong> </motion.p>
                    <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{delay: 0.2}} className="flex flex-col sm:flex-row justify-center items-center gap-4" >
                        <motion.button variants={ctaButtonVariants} initial="pulse" whileHover="hover" whileTap="tap" animate="pulse" onClick={handleGetStartedClick} className="bg-white text-[var(--color-primary)] font-semibold px-8 py-4 rounded-lg shadow-lg text-lg transition duration-300 ease-in-out transform hover:-translate-y-1 w-full sm:w-auto" > Start Generating Now <FiChevronRight className="inline-block ml-2 -mr-1 h-5 w-5 align-middle" /> </motion.button>
                        <motion.a href="#research-section" onClick={(e) => { e.preventDefault(); scrollToSection('research-section'); }} whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} whileTap={{ scale: 0.95 }} className="border border-white/50 text-white font-medium px-6 py-4 rounded-lg text-lg transition duration-300 ease-in-out w-full sm:w-auto hover:bg-white/10" > Explore Innovations </motion.a>
                    </motion.div>
                </div>
            </motion.section>

            <Footer />
        </div>
    );
}