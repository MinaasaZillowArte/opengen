'use client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    // useReducer, // Tidak digunakan secara eksplisit, bisa dihapus jika tidak ada rencana
    createContext,
    JSX,
    // Dispatch, // Tidak digunakan secara eksplisit, bisa dihapus jika tidak ada rencana
    // SetStateAction // Tidak digunakan secara eksplisit, bisa dihapus jika tidak ada rencana
} from 'react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import katex from 'katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    FiMessageSquare, FiPlus, FiTrash2, FiUser, FiLogOut, FiSettings,
    FiCopy, FiCpu, FiLoader, FiSend, FiMenu, FiX, FiSun, FiMoon, FiZap, FiTerminal,
    FiGithub, FiCheck,  FiLock, FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp,
    FiSliders, FiGlobe, FiType, FiHelpCircle,
    FiSearch, FiRefreshCw, FiSquare, FiAlertTriangle, FiArchive, FiClock, FiPaperclip, FiMic, FiDatabase,
    FiMaximize,  FiCode, FiBriefcase, FiActivity, FiCalendar,
    FiInfo as FiInfoCircle, FiArchive as FiArchiveIcon, FiStar, FiTrash, FiMoreVertical, FiEye as FiEyeIcon, FiEyeOff as FiEyeOffIcon
} from 'react-icons/fi';
import { motion, AnimatePresence, animate, AnimationPlaybackControls } from 'framer-motion';
import Link from 'next/link';
import { uuidv4 } from '@/lib/utils'; // Assuming a utility to generate UUIDs
import type { Components } from 'react-markdown';
import type { Element } from 'hast';

// Firebase Auth
import { auth } from '@/lib/firebase'; // Pastikan path ini benar
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';


// --- Constants ---
const API_ENDPOINT = "/api/chat";
const DEEPSEEK_V3_MODEL = "deepseek-ai/DeepSeek-V3-0324";
const DEEPSEEK_R1_MODEL = "deepseek-ai/DeepSeek-R1";
const QWEN_235B_MODEL = "Qwen/Qwen3-235B-A22B";
const APP_TITLE = "ChatNPT"; // Updated title for versioning
const APP_AUTHOR = "OpenGen AI";
const LOCALSTORAGE_HISTORY_KEY_BASE = 'chatnpt_history_'; // Base key, user ID will be appended if login implemented
const LOCALSTORAGE_SETTINGS_KEY_BASE = 'chatnpt_settings_'; // Base key
const APP_VERSION = "2.1.0"; // Updated app version with new features
const LOCALSTORAGE_HISTORY_KEY = `${LOCALSTORAGE_HISTORY_KEY_BASE}v${APP_VERSION}`; // Key for non-logged-in users or current single-user mode
const LOCALSTORAGE_SETTINGS_KEY = `${LOCALSTORAGE_SETTINGS_KEY_BASE}v${APP_VERSION}`;

const MAX_HISTORY_MESSAGES_API = 10;
const MAX_TITLE_LENGTH = 50;
const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 400;
const AUTO_SCROLL_DELAY = 120;
const TYPING_ANIMATION_SPEED_FACTOR = 0.018;
const STREAM_UPDATE_INTERVAL = 100;
const MOBILE_BREAKPOINT = 768;

// --- Types ---
type Language = 'en' | 'id' | 'zh';
type AppVersionMode = '1.0' | '1.5';

type UserRole = 'user';
type AssistantRole = 'ai';
type SystemRole = 'system';
type ThinkingRole = 'thinking';
type ErrorRole = 'error';
type SpeakerRole = UserRole | AssistantRole | ThinkingRole | ErrorRole;

type MessageType = 'text' | 'code' | 'thinking' | 'error';

type DisplayedChatMessage = {
    id: string;
    speaker: SpeakerRole;
    text: string | string[];
    type?: MessageType;
    isStreaming?: boolean;
    fullText?: string;
    userPromptId?: string;
    generationIndex?: number;
    isCurrentGeneration?: boolean;
    totalGenerations?: number;
    isGenerating?: boolean;
    wasCancelled?: boolean;
    timestamp: number;
    modelUsed?: string;
    thinkingSteps?: string[];
};

type ChatHistoryEntry = {
    chatId: string;
    title: string | null;
    messages: DisplayedChatMessage[];
    createdAt: number;
    lastUpdatedAt: number;
    appVersionMode: AppVersionMode;
    isThinkingModeToggleOn: boolean;
    model1_0Base?: string;
    pinned?: boolean; // New: For pinning chats
    archived?: boolean; // New: For archiving chats
    userId?: string; // Placeholder for multi-user, not fully implemented
};

type InterfaceDensity = 'compact' | 'comfortable' | 'spacious';

type UserSettings = {
    theme: 'light' | 'dark' | 'system';
    isStreamingEnabled: boolean; // Default will be false
    interfaceDensity: InterfaceDensity;
    autoSuggestEnabled: boolean;
    language: Language;
    sendWithCtrlEnter: boolean;
    showTimestamp: boolean;
    defaultAppVersionMode: AppVersionMode;
    defaultModel1_0: string;
    enableThinkingModeByDefault1_0: boolean;
    fontSize: 'small' | 'medium' | 'large';
    sidebarWidth: number;
    showArchivedChats: boolean; // New: Toggle for showing archived chats
};

type SettingsContextType = {
    settings: UserSettings;
    updateSettings: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
    t: (key: string, params?: Record<string, string>) => string;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

type ApiMessage = {
    role: UserRole | AssistantRole | SystemRole;
    content: string;
};

type SuggestionChip = {
    id: string;
    labelKey: string;
    icon: React.ElementType;
    prompt?: string;
    action?: () => void;
    disabled?: boolean;
};

type ModelOption = {
    id: string;
    nameKey: string;
    descriptionKey: string;
    isDefault1_0?: boolean;
    isThinking1_0?: boolean;
    is1_5?: boolean;
    isExperimental?: boolean;
};

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
}

interface SettingsModalProps extends BaseModalProps {
    settings: UserSettings;
    onSettingsChange: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
    isLoggedIn: boolean;
    onDeleteAllChats: () => void; // New prop
}

interface LoginPromptModalProps extends BaseModalProps {
    onLoginRegister: () => void;
}

interface ConfirmationModalProps extends BaseModalProps {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    isDestructive?: boolean;
}

type UserProfile = {
    id: string; // Add user ID
    name: string;
    email: string;
    avatarUrl?: string;
};

type TooltipProps = {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    delay?: number;
    disabled?: boolean;
};

// --- Data ---


const availableModels: ModelOption[] = [
    { id: DEEPSEEK_V3_MODEL, nameKey: "model_deepseek_v3_name", descriptionKey: "model_deepseek_v3_desc", isDefault1_0: true },
    { id: DEEPSEEK_R1_MODEL, nameKey: "model_deepseek_r1_name", descriptionKey: "model_deepseek_r1_desc", isThinking1_0: true, isExperimental: true },
    { id: QWEN_235B_MODEL, nameKey: "model_qwen_235b_name", descriptionKey: "model_qwen_235b_desc", is1_5: true, isExperimental: true },
];

const suggestionChipsData: SuggestionChip[] = [
    { id: 'code', labelKey: 'code', icon: FiCode, prompt: "Write code for " },
    { id: 'plan', labelKey: 'makeAPlan', icon: FiCalendar, prompt: "Create a detailed plan for " },
    { id: 'news', labelKey: 'news', icon: FiActivity, prompt: "Summarize the latest news about " },
];

// --- React Components ---

const InlineMath: React.FC<{ value: string }> = React.memo(({ value }) => {
    // ... (kode komponen InlineMath tidak berubah)
    const [html, setHtml] = useState<string>('');
    useEffect(() => {
        try {
            if (value) {
                setHtml(katex.renderToString(value, { throwOnError: false, displayMode: false, output: 'html', strict: false }));
            } else {
                setHtml('');
            }
        } catch (error) {
            console.error('KaTeX inline render error:', error);
            setHtml(`<span class="text-red-500 dark:text-red-400 font-mono text-xs">[KaTeX Error: ${value}]</span>`);
        }
    }, [value]);
    if (!html) return null;
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
});
InlineMath.displayName = 'InlineMath';

const BlockMath: React.FC<{ value: string }> = React.memo(({ value }) => {
    // ... (kode komponen BlockMath tidak berubah)
    const [html, setHtml] = useState<string>('');
    useEffect(() => {
        try {
            if (value) {
                setHtml(katex.renderToString(value, { throwOnError: false, displayMode: true, output: 'html', strict: false }));
            } else {
                setHtml('');
            }
        } catch (error) {
            console.error('KaTeX block render error:', error);
            setHtml(`<div class="text-red-500 dark:text-red-400 font-mono text-xs my-2">[KaTeX Error: ${value}]</div>`);
        }
    }, [value]);
    if (!html) return null;
    return <div className="my-2 overflow-x-auto katex-display-wrapper" dangerouslySetInnerHTML={{ __html: html }} />;
});
BlockMath.displayName = 'BlockMath';

const CodeBlock: React.FC<{ language: string | null; value: string; t: (key: string) => string }> = React.memo(({ language, value, t }) => {
    // ... (kode komponen CodeBlock tidak berubah)
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCopy = useCallback(() => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        navigator.clipboard.writeText(value).then(() => {
            setCopyStatus('copied');
            copyTimeoutRef.current = setTimeout(() => setCopyStatus('idle'), 2000);
        }).catch(err => {
            console.error("Code copy failed:", err);
            setCopyStatus('failed');
            copyTimeoutRef.current = setTimeout(() => setCopyStatus('idle'), 2000);
        });
    }, [value]);

    useEffect(() => {
        return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
    }, []);

    const effectiveLanguage = language || 'text';

    return (
        <div className="code-block-container not-prose my-4 bg-[#2d2d2d] rounded-lg overflow-hidden shadow-lg relative group border border-gray-700/50">
            <div className="flex justify-between items-center px-4 py-1.5 bg-gray-700/60 border-b border-gray-600/50">
                <span className="text-xs text-gray-400 font-mono select-none">{effectiveLanguage}</span>
                <Tooltip text={copyStatus === 'copied' ? t('copied') : copyStatus === 'failed' ? t('copyFailed') : t('copyCode')} position="top" delay={500}>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-600/50 transition-colors opacity-70 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-60"
                        aria-label={t('copyCode')}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={copyStatus}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.15 }}
                            >
                                {copyStatus === 'copied' ? <FiCheck className="w-4 h-4 text-green-400" /> :
                                 copyStatus === 'failed' ? <FiX className="w-4 h-4 text-red-400" /> :
                                 <FiCopy className="w-4 h-4" />}
                            </motion.div>
                        </AnimatePresence>
                    </button>
                </Tooltip>
            </div>
            <SyntaxHighlighter
                language={effectiveLanguage}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    borderRadius: '0 0 0.5rem 0.5rem',
                    backgroundColor: 'transparent'
                }}
                wrapLongLines={true}
                PreTag={(props: React.ComponentProps<'pre'>) => <div className="overflow-x-auto" {...props} />}
            >
                {value}
            </SyntaxHighlighter>
            <div className="px-4 py-2 bg-yellow-900/30 border-t border-yellow-700/40 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300 italic">{t('useCodeCaution')}</p>
            </div>
        </div>
    );
});
CodeBlock.displayName = 'CodeBlock';

type ChatBubbleProps = {
    message: DisplayedChatMessage;
    isStreamingEnabled: boolean;
    density: InterfaceDensity;
    showTimestamp: boolean;
    fontSize: 'small' | 'medium' | 'large';
    t: (key: string) => string;
    language: Language;
    onRegenerate?: (userPromptId: string) => void;
    onNavigate?: (userPromptId: string, direction: 'prev' | 'next') => void;
    isThinkingModeActive: boolean;
};

const ChatBubble = React.memo(({message, isStreamingEnabled, density, showTimestamp, fontSize, t, language, onRegenerate, onNavigate }: ChatBubbleProps) => {
    const isUser = message.speaker === 'user';
    const isThinkingBubble = message.speaker === 'thinking';
    const isAiResponse = message.speaker === 'ai';
    const isError = message.speaker === 'error';

    const [displayedText, setDisplayedText] = useState(
        (isAiResponse || isUser || isError) && typeof message.text === 'string' ? (message.isStreaming ? '' : (message.fullText ?? message.text)) : ''
    );
    const [isTyping, setIsTyping] = useState(false);
    const controlsRef = useRef<AnimationPlaybackControls | null>(null);
    const [isReasoningExpanded, setIsReasoningExpanded] = useState(true);

    // PERBAIKAN BUG OUTPUT AI HILANG:
    // Revisi useEffect untuk displayedText.
    // Menggunakan kode asli Anda dengan sedikit penyesuaian pada kondisi dan menghilangkan useEffect kedua.
    useEffect(() => {
        let isMounted = true;
        controlsRef.current?.stop();

        const targetText = (isAiResponse || isUser || isError) && typeof message.text === 'string' ? (message.fullText ?? message.text) : '';

        if (isStreamingEnabled && message.isStreaming && isAiResponse && !isError) {
            // Hanya animasikan jika targetText valid (tidak kosong)
            if (targetText) {
                if (targetText !== displayedText) {
                    // Logika animasi append dari kode Anda
                    const currentDisplayedLength = displayedText.length;
                    // Pastikan currentDisplayedLength tidak melebihi targetText (misalnya jika displayedText direset atau targetText berubah total)
                    const safeCurrentDisplayedLength = targetText.startsWith(displayedText) ? currentDisplayedLength : 0;
                    if (safeCurrentDisplayedLength === 0 && displayedText !== '') {
                        // Jika displayedText tidak cocok dengan awal targetText, reset displayedText sebelum animasi
                        // Ini penting jika targetText berubah total selama streaming (jarang terjadi, tapi defensif)
                        setDisplayedText(''); // Ini akan memicu re-run, jadi hati-hati.
                                             // Lebih baik, logika ini ditangani dengan baik oleh 'else' di bawah.
                                             // Atau, mulai animasi dari awal jika tidak cocok.
                    }

                    const newContent = targetText.slice(safeCurrentDisplayedLength);

                    if (newContent.length > 0) {
                        setIsTyping(true);
                        // Jika displayedText direset (karena tidak cocok), maka `prev` di setDisplayedText harusnya dimulai dari string kosong.
                        const baseTextForAnimation = safeCurrentDisplayedLength === 0 ? '' : displayedText.substring(0, safeCurrentDisplayedLength);

                        controlsRef.current = animate(0, newContent.length, {
                            duration: Math.max(0.05, newContent.length * TYPING_ANIMATION_SPEED_FACTOR),
                            ease: "linear",
                            onUpdate: (latest) => {
                                if (isMounted) {
                                    setDisplayedText(baseTextForAnimation + newContent.slice(0, Math.round(latest)));
                                }
                            },
                            onComplete: () => {
                                if (isMounted) {
                                    setDisplayedText(targetText);
                                    setIsTyping(false);
                                }
                            }
                        });
                    } else { // No new content to animate, but target might be different (e.g., shorter) or stream ended.
                        if (targetText !== displayedText) setDisplayedText(targetText); // Sync to final
                        if (!message.isStreaming && isTyping) setIsTyping(false); // Ensure typing stops if stream ended
                    }
                } else if (!message.isStreaming && isTyping) {
                    // targetText === displayedText, but stream has finished. Ensure typing animation stops.
                    setIsTyping(false);
                }
                // Jika targetText === displayedText dan masih streaming, jangan lakukan apa-apa. isTyping sudah benar.
            } else if (isTyping) { // targetText kosong tapi masih typing (misal stream error tapi belum dihandle)
                setIsTyping(false);
            }
        } else { // Not streaming, or user/error message, or streaming disabled
            if (targetText !== displayedText) {
                setDisplayedText(targetText);
            }
            if (isTyping) {
                setIsTyping(false);
            }
        }

        // Khusus untuk thinking bubble, pastikan isTyping selalu false
        if (isThinkingBubble && isTyping) {
            setIsTyping(false);
        }

        return () => {
            isMounted = false;
            if (controlsRef.current) controlsRef.current.stop();
        };
    }, [
        message.id, message.fullText, message.isStreaming, message.speaker, message.text,
        isStreamingEnabled, isAiResponse, isUser, isThinkingBubble, isError,
        displayedText // Memasukkan displayedText di sini penting agar currentDisplayedLength benar.
                      // Jika ini menyebabkan masalah performa, bisa dioptimasi dengan useRef untuk currentDisplayedLength.
                      // Untuk saat ini, kita biarkan untuk melihat apakah bug hilang.
        , isTyping]);
    // Akhir PERBAIKAN BUG

    const reasoningSteps = (isThinkingBubble && Array.isArray(message.text)) ? message.text : (message.speaker === 'ai' && Array.isArray(message.thinkingSteps) ? message.thinkingSteps : []);
    const textToRender = (isAiResponse || isUser || isError) ? displayedText : ''; // textToRender untuk Markdown
    const showAiControls = isAiResponse && !message.isStreaming && !message.isGenerating && !message.wasCancelled;
    const canRegenerate = showAiControls && onRegenerate && message.userPromptId !== undefined;
    const canNavigate = showAiControls && onNavigate && message.userPromptId !== undefined && (message.totalGenerations ?? 0) > 1;
    const canGoPrev = canNavigate && (message.generationIndex ?? 0) > 0;
    const canGoNext = canNavigate && (message.generationIndex ?? 0) < (message.totalGenerations ?? 1) - 1;

    const densityPadding = useMemo(() => { /* ... (tidak berubah) ... */
        switch (density) {
            case 'compact': return 'px-3 py-2';
            case 'comfortable': return 'px-4 py-2.5';
            case 'spacious': return 'px-5 py-3';
            default: return 'px-4 py-2.5';
        }
    }, [density]);
    const fontSizeClass = useMemo(() => { /* ... (tidak berubah) ... */
        switch (fontSize) {
            case 'small': return 'text-sm';
            case 'medium': return 'text-base';
            case 'large': return 'text-lg';
            default: return 'text-base';
        }
    }, [fontSize]);

    const markdownComponents: Partial<Components> = useMemo(() => ({
        p: ({ node: _node, children, ...props }: React.PropsWithChildren<{ node?: Element } & Omit<JSX.IntrinsicElements['p'], 'children' | 'node'>>) => {
            // Original logic used `node` to check children, but `_node` is from `hast` Element type
            // For simplicity, if `_node` is needed, its type should be `Element` from 'hast'
            // The linter flagged `node` as unused, so I'm using `_node`
            // If the original logic `if (node?.children?.length === 1)` is critical,
            // then `_node` should be used and typed correctly.
            // For now, assuming the primary path is the `else` part of that original check.
            // if (_node?.children?.length === 1) {
            //     const childNode = _node.children[0];
            //     if (childNode.type === 'element' && (childNode.tagName === 'code' || childNode.tagName === 'math')) { // Example check
            //         return <>{children}</>;
            //     }
            // }
            return <p className="mb-3 last:mb-0" {...props}>{children}</p>;
        },
        strong: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['strong'], 'node'>) => <strong className="font-semibold" {...props} />,
        em: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['em'], 'node'>) => <em className="italic" {...props} />,
        ol: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['ol'], 'node'>) => <ol className="list-decimal list-outside ml-6 my-3 space-y-1.5" {...props} />,
        ul: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['ul'], 'node'>) => <ul className="list-disc list-outside ml-6 my-3 space-y-1.5" {...props} />,
        li: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['li'], 'node'>) => <li className="mb-1" {...props} />,
        blockquote: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['blockquote'], 'node'>) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-r-md" {...props} />,
        hr: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['hr'], 'node'>) => <hr className="my-5 border-gray-200 dark:border-gray-700" {...props} />,
        a: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['a'], 'node'>) => <a className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer nofollow" {...props} />,
        h1: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h1'], 'node'>) => <h1 className="text-2xl font-bold mt-6 mb-3 border-b pb-2 border-gray-300 dark:border-gray-700" {...props} />,
        h2: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h2'], 'node'>) => <h2 className="text-xl font-semibold mt-5 mb-2 border-b pb-1.5 border-gray-300 dark:border-gray-700" {...props} />,
        h3: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h3'], 'node'>) => <h3 className="text-lg font-semibold mt-5 mb-2" {...props} />,
        h4: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h4'], 'node'>) => <h4 className="text-base font-semibold mt-4 mb-1.5" {...props} />,
        h5: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h5'], 'node'>) => <h5 className="text-sm font-semibold mt-3 mb-1" {...props} />,
        h6: ({ node: _node, ...props }: { node?: Element } & Omit<JSX.IntrinsicElements['h6'], 'node'>) => <h6 className="text-xs font-semibold mt-3 mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />,
        code({ node: _node, inline, className, children, ...props }: { node?: Element; inline?: boolean; className?: string; children: React.ReactNode } & Record<string, unknown>) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1].toLowerCase() : null;
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline) {
                if (language === 'math' || language === 'latex') {
                    return <BlockMath value={codeContent} />;
                }
                return <CodeBlock language={language} value={codeContent} t={t} {...props} />;
            }
            return (<code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-[0.9em] font-mono mx-0.5 break-words" {...props} >{children}</code>);
        },
        inlineMath: ({ value }: { value: string }) => !value ? null : <InlineMath value={value} />,
        math: ({ value }: { value: string }) => !value ? null : <BlockMath value={value} />,
    }), [t]);
    const formattedTimestamp = useMemo(() => { /* ... (tidak berubah) ... */
        return new Date(message.timestamp).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    }, [message.timestamp, language]);
    const avatarSizeClass = useMemo(() => { /* ... (tidak berubah) ... */
        return density === 'compact' ? 'w-6 h-6' : density === 'comfortable' ? 'w-7 h-7' : 'w-8 h-8';
    }, [density]);
    const iconSizeClass = useMemo(() => { /* ... (tidak berubah) ... */
        return density === 'compact' ? 'w-3.5 h-3.5' : density === 'comfortable' ? 'w-4 h-4' : 'w-4.5 h-4.5';
    }, [density]);
    const bubbleVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
        hidden: { opacity: 0, y: 15, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
    }), []);
    const reasoningStepVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
        hidden: { opacity: 0, x: -15 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
    }), []);
    const controlsVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, delay: 0.15 } }
    }), []);
    const bubbleClasses = useMemo(() => { /* ... (tidak berubah) ... */
        let classes = 'relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-xl shadow-md ';
        classes += densityPadding + ' ' + fontSizeClass + ' ';
        if (isUser) {
            classes += 'bg-blue-600 dark:bg-blue-700 text-white rounded-br-lg';
        } else if (isThinkingBubble) {
            classes += 'bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600/80 text-gray-600 dark:text-gray-300 rounded-bl-lg w-full';
        } else if (isError) {
            classes += 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200 rounded-bl-lg';
        } else { // AI Response
            classes += 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-lg border border-gray-200 dark:border-gray-700';
        }
         return classes;
    }, [densityPadding, fontSizeClass, isUser, isThinkingBubble, isError]);
    const avatarClasses = useMemo(() => { /* ... (tidak berubah) ... */
        let classes = `self-start mt-1 rounded-full flex items-center justify-center flex-shrink-0 shadow ${avatarSizeClass}`;
        if (isUser) {
            classes += ' bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400';
        } else if (isThinkingBubble) {
             classes += ' bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400';
        } else if (isError) {
             classes += ' bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400';
        } else { // AI
             classes += ' bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400';
        }
        return classes;
    }, [avatarSizeClass, isUser, isThinkingBubble, isError]);
    const AvatarIcon = useMemo(() => { /* ... (tidak berubah) ... */
        if (isUser) return <FiUser className={`${iconSizeClass}`} />;
        if (isThinkingBubble) return <FiZap className={`${iconSizeClass}`} />;
        if (isError) return <FiAlertTriangle className={`${iconSizeClass}`} />;
        return <FiCpu className={`${iconSizeClass}`} />;
    }, [iconSizeClass, isUser, isThinkingBubble, isError]);

    const renderContent = () => { /* ... (tidak berubah, tapi mengandalkan displayedText yang sudah diperbaiki) ... */
        if (isThinkingBubble) {
            return (
                <div className="text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5"/> {t('thinkingProcess')}</p>
                        <motion.button
                            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                            className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
                            title={isReasoningExpanded ? t('hideSteps') : t('showSteps')} aria-label={isReasoningExpanded ? t('hideSteps') : t('showSteps')} whileTap={{ scale: 0.9 }} aria-expanded={isReasoningExpanded}
                        >
                            <AnimatePresence initial={false} mode="wait">
                                <motion.div key={isReasoningExpanded ? 'up' : 'down'} initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 45 }} transition={{ duration: 0.2 }}>
                                    {isReasoningExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                    <AnimatePresence initial={false}>
                        {isReasoningExpanded && (
                            <motion.div
                                key="reasoning-steps-content"
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto', transition: { duration: 0.3, ease: "easeInOut" } }}
                                exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } }}
                                className="space-y-2.5 overflow-hidden pl-1"
                            >
                                {reasoningSteps.map((step, i) => step.trim() && (
                                    <motion.div layout key={i} variants={reasoningStepVariants} initial="hidden" animate="visible" exit="hidden" className="flex items-start gap-2 text-xs">
                                        <FiChevronRight className="w-3 h-3 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                        <div className="prose prose-xs dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-snug">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} components={markdownComponents} children={step} />
                                        </div>
                                    </motion.div>
                                ))}
                                {message.isStreaming && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-6 pt-1">
                                        <FiLoader className="animate-spin w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        } else { // User, AI Response, or Error bubble
            return (
                <>
                    <div className={`markdown-content break-words prose dark:prose-invert max-w-none leading-relaxed selection:bg-blue-200 dark:selection:bg-blue-800/50 ${
                         fontSize === 'small' ? 'prose-sm' : fontSize === 'large' ? 'prose-lg' : 'prose-base'
                     }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} components={markdownComponents} children={textToRender} />
                        {isAiResponse && isTyping && isStreamingEnabled && !message.wasCancelled && (
                            <motion.span className="inline-block w-1.5 h-4 bg-current ml-px align-bottom" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} aria-hidden="true" />
                        )}
                        {message.wasCancelled && (
                            <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 italic">{t('responseCancelledByUser')}</span>
                        )}
                    </div>
                     {showTimestamp && (
                         <div className={`text-[10px] mt-1.5 text-right ${isUser ? 'text-blue-200 dark:text-blue-300/70' : 'text-gray-400 dark:text-gray-500'}`}>
                             {formattedTimestamp}
                         </div>
                     )}
                </>
            );
        }
    };

    return (
        <motion.div /* ... (tidak berubah) ... */
            layout="position"
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-3 md:my-4`}
            id={`message-${message.id}`}
        >
            <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} gap-2.5`}>
                {!isUser && <div className={avatarClasses}>{AvatarIcon}</div>}
                <motion.div layout className={bubbleClasses}>
                    {renderContent()}
                </motion.div>
                {isUser && <div className={avatarClasses}>{AvatarIcon}</div>}
            </div>
            {(canRegenerate || canNavigate) && (
                <motion.div layout variants={controlsVariants} initial="hidden" animate="visible" className={`flex items-center gap-2 mt-2 ${isUser ? 'self-end mr-9 md:mr-10' : 'self-start ml-9 md:ml-10'}`}>
                    {canRegenerate && (
                        <Tooltip text={t('regenerateResponse')} position={isUser ? 'bottom' : 'top'} delay={500}>
                             <motion.button
                                onClick={() => onRegenerate(message.userPromptId!)}
                                aria-label={t('regenerateResponse')}
                                className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                whileHover={!onRegenerate ? undefined : { scale: 1.1, rotate: 15 }} whileTap={!onRegenerate ? undefined : { scale: 0.9, rotate: -5 }}>
                                <FiRefreshCw className="w-3.5 h-3.5" />
                            </motion.button>
                        </Tooltip>
                    )}
                    {canNavigate && (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-0.5">
                             <Tooltip text={t('previousResponse')} position={isUser ? 'bottom' : 'top'} delay={500} disabled={!canGoPrev}>
                                <motion.button onClick={() => onNavigate(message.userPromptId!, 'prev')} disabled={!canGoPrev} aria-label={t('previousResponse')} className={`p-1 rounded text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500`} whileHover={!canGoPrev ? undefined : { scale: 1.1 }} whileTap={!canGoPrev ? undefined : { scale: 0.9 }}>
                                    <FiChevronLeft className="w-4 h-4" />
                                </motion.button>
                            </Tooltip>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono px-1 select-none">
                                { (message.generationIndex ?? 0) + 1 } / { message.totalGenerations ?? 1 }
                            </span>
                             <Tooltip text={t('nextResponse')} position={isUser ? 'bottom' : 'top'} delay={500} disabled={!canGoNext}>
                                <motion.button onClick={() => onNavigate(message.userPromptId!, 'next')} disabled={!canGoNext} aria-label={t('nextResponse')} className={`p-1 rounded text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500`} whileHover={!canGoNext ? undefined : { scale: 1.1 }} whileTap={!canGoNext ? undefined : { scale: 0.9 }}>
                                    <FiChevronRight className="w-4 h-4" />
                                </motion.button>
                             </Tooltip>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
});
ChatBubble.displayName = 'ChatBubble';

const Tooltip = React.memo(({ text, children, position = 'top', className = '', delay = 0, disabled = false }: TooltipProps) => {
    // ... (kode komponen Tooltip tidak berubah)
    const [show, setShow] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (disabled) return;
        if (delay > 0) {
            timeoutRef.current = setTimeout(() => setShow(true), delay);
        } else {
            setShow(true);
        }
    }, [delay, disabled]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShow(false);
    }, []);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const positionClasses = useMemo(() => {
        switch (position) {
            case 'bottom': return 'top-full mt-2 left-1/2 -translate-x-1/2';
            case 'left': return 'right-full mr-2 top-1/2 -translate-y-1/2';
            case 'right': return 'left-full ml-2 top-1/2 -translate-y-1/2';
            case 'top':
            default: return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
        }
    }, [position]);

    return (
        <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
            <AnimatePresence>
                {show && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-[60] whitespace-nowrap px-2.5 py-1.5 text-xs font-medium text-white bg-gray-800 dark:bg-gray-900 rounded-md shadow-lg ${positionClasses} ${className}`}
                        role="tooltip"
                    >
                        {text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
Tooltip.displayName = 'Tooltip';

const BaseModal: React.FC<React.PropsWithChildren<BaseModalProps & { titleId: string; modalClassName?: string }>> = ({
    isOpen, onClose, children, titleId, modalClassName = 'max-w-md', t
}) => {
    // ... (kode komponen BaseModal tidak berubah)
    const modalVariants = useMemo(() => ({
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 } }
    }), []);
    const backdropVariants = useMemo(() => ({
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } }
    }), []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 z-[70] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby={titleId}
                >
                    <motion.div
                        key="modal-content"
                        variants={modalVariants}
                        className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col ${modalClassName}`}
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
BaseModal.displayName = 'BaseModal';

const SettingsModal = React.memo(({ isOpen, onClose, settings, onSettingsChange, isLoggedIn, t, onDeleteAllChats }: SettingsModalProps) => {
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

    const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { onSettingsChange('language', e.target.value as Language); }, [onSettingsChange]);
    const handleThemeChange = useCallback((theme: 'light' | 'dark' | 'system') => { onSettingsChange('theme', theme); }, [onSettingsChange]);
    const handleStreamingToggle = useCallback(() => { onSettingsChange('isStreamingEnabled', !settings.isStreamingEnabled); }, [settings.isStreamingEnabled, onSettingsChange]);
    const handleDensityChange = useCallback((density: InterfaceDensity) => { onSettingsChange('interfaceDensity', density); }, [onSettingsChange]);
    const handleAutoSuggestToggle = useCallback(() => { onSettingsChange('autoSuggestEnabled', !settings.autoSuggestEnabled); }, [settings.autoSuggestEnabled, onSettingsChange]);
    const handleSendShortcutToggle = useCallback(() => { onSettingsChange('sendWithCtrlEnter', !settings.sendWithCtrlEnter); }, [settings.sendWithCtrlEnter, onSettingsChange]);
    const handleTimestampToggle = useCallback(() => { onSettingsChange('showTimestamp', !settings.showTimestamp); }, [settings.showTimestamp, onSettingsChange]);
    const handleFontSizeChange = useCallback((size: 'small' | 'medium' | 'large') => { onSettingsChange('fontSize', size); }, [onSettingsChange]);
    const handleSidebarWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { onSettingsChange('sidebarWidth', parseInt(e.target.value, 10)); }, [onSettingsChange]);
    const handleShowArchivedToggle = useCallback(() => { onSettingsChange('showArchivedChats', !settings.showArchivedChats); }, [settings.showArchivedChats, onSettingsChange]);

    const confirmDeleteAllAction = () => {
        onDeleteAllChats();
        setConfirmDeleteAllOpen(false);
        onClose(); // Close settings modal too after deleting all
    };

    const SettingRow: React.FC<React.PropsWithChildren<{ label: string; description?: string; icon: React.ElementType }>> = ({ label, description, icon: Icon, children }) => (
        <div className="flex items-start justify-between py-3">
            <div className="flex items-center gap-3 mr-4">
                 <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                 </div>
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );

     const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
         <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-5 mb-2 px-1">{title}</h3>
     );

      const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; id: string; disabled?: boolean }> = ({ checked, onChange, id, disabled = false }) => (
           <button
                id={id}
                onClick={onChange}
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:ring-blue-500 ${
                    checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}/>
            </button>
      );

       const SegmentedControl: React.FC<{ options: { value: string; label: string }[]; selectedValue: string; onChange: (value: string) => void; name: string }> = ({ options, selectedValue, onChange, name }) => (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-0.5 rounded-md">
                {options.map(option => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        aria-pressed={selectedValue === option.value}
                        name={name}
                        value={option.value}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                            selectedValue === option.value
                                ? 'bg-white dark:bg-gray-500 shadow text-gray-800 dark:text-gray-100 font-medium'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
       );

    return (
        <>
            <BaseModal isOpen={isOpen} onClose={onClose} titleId="settings-title" modalClassName="max-w-xl" t={t}>
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="settings-title" className="text-lg font-semibold">{t('settingsTitle')}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800" aria-label="Close settings">
                        <FiX size={20}/>
                    </button>
                </div>
                <div className="overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 flex-grow">
                    <SectionHeader title={t('general')} />
                     <SettingRow label={t('appearance')} icon={FiSun}>
                        <SegmentedControl name="theme" options={[{value: 'light', label: t('light')}, {value: 'dark', label: t('dark')}, {value: 'system', label: t('system')}]} selectedValue={settings.theme} onChange={(value) => handleThemeChange(value as 'light'|'dark'|'system')} />
                     </SettingRow>
                    <SettingRow label={t('responseLanguage')} icon={FiGlobe}>
                         <select id="lang-select" value={settings.language} onChange={handleLanguageChange} className="text-xs p-1.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
                             <option value="en">{t('english')}</option>
                             <option value="id">{t('indonesian')}</option>
                             <option value="zh">{t('chinese')}</option>
                         </select>
                     </SettingRow>
                    <SettingRow label={t('interfaceDensity')} icon={FiSliders}>
                        <SegmentedControl name="density" options={[{value: 'compact', label: t('compact')}, {value: 'comfortable', label: t('comfortable')}, {value: 'spacious', label: t('spacious')}]} selectedValue={settings.interfaceDensity} onChange={(value) => handleDensityChange(value as InterfaceDensity)} />
                     </SettingRow>
                     <SettingRow label={t('fontSizeLabel')} icon={FiType}>
                        <SegmentedControl name="fontsize" options={[{value: 'small', label: t('small')}, {value: 'medium', label: t('medium')}, {value: 'large', label: t('large')}]} selectedValue={settings.fontSize} onChange={(value) => handleFontSizeChange(value as 'small'|'medium'|'large')} />
                     </SettingRow>
                      <SettingRow label={t('sidebarWidth')} icon={FiMaximize}>
                            <div className="flex items-center gap-2">
                                <input type="range" min={MIN_SIDEBAR_WIDTH} max={MAX_SIDEBAR_WIDTH} step={10} value={settings.sidebarWidth} onChange={handleSidebarWidthChange} className="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-blue-600" />
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{settings.sidebarWidth}px</span>
                            </div>
                      </SettingRow>

                    <SectionHeader title={t('behavior')} />
                    <SettingRow label={t('streamingResponse')} icon={FiZap}>
                        <ToggleSwitch id="stream-toggle" checked={settings.isStreamingEnabled} onChange={handleStreamingToggle} />
                    </SettingRow>
                    <SettingRow label={t('autoSuggestPrompts')} icon={FiMessageSquare}>
                        <ToggleSwitch id="autosuggest-toggle" checked={settings.autoSuggestEnabled} onChange={handleAutoSuggestToggle} />
                    </SettingRow>
                    <SettingRow label={t('sendShortcutEnable')} description={t('sendShortcut')} icon={FiTerminal}>
                       <ToggleSwitch id="sendshortcut-toggle" checked={settings.sendWithCtrlEnter} onChange={handleSendShortcutToggle} />
                    </SettingRow>
                    <SettingRow label={t('timestampEnable')} icon={FiClock}>
                       <ToggleSwitch id="timestamp-toggle" checked={settings.showTimestamp} onChange={handleTimestampToggle} />
                    </SettingRow>
                    <SettingRow label={t('showArchived')} icon={FiArchiveIcon}>
                       <ToggleSwitch id="show-archived-toggle" checked={settings.showArchivedChats} onChange={handleShowArchivedToggle} />
                    </SettingRow>


                     <SectionHeader title={t('accountSettings')} />
                     {isLoggedIn ? (
                         <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
                             {/* ... (Account settings placeholder content, tidak berubah) ... */}
                            <div className="flex justify-between items-center opacity-60"><span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><FiLock className="w-4 h-4"/> {t('apiKeyManagement')}</span> <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{t('unavailable')}</span> </div>
                            <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><FiDatabase className="w-4 h-4"/> {t('dataControls')}</span> <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-blue-600 dark:text-blue-400 hover:underline opacity-70 cursor-not-allowed" title={t('unavailable')}>{t('managePrivacy')}</a> </div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600 dark:text-gray-400">{t('usageLimits')}</span> <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('freeTier')}</span> </div>
                            <div className="flex justify-between items-center opacity-60"><span className="text-sm text-gray-600 dark:text-gray-400">{t('exportHistory')}</span> <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{t('unavailable')}</span> </div>
                         </div>
                     ) : (
                         <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 text-center flex items-center justify-center gap-3">
                             <FiLock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"/>
                             <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('accountRequired')}</p>
                         </div>
                     )}

                    <SectionHeader title={t('dangerZone')} />
                    <div className="mt-2">
                        <button
                            onClick={() => setConfirmDeleteAllOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-red-500 dark:border-red-400 text-red-600 dark:text-red-300 bg-white dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
                        >
                            <FiTrash2 size={16}/>
                            <span>{t('deleteAllChats')}</span>
                        </button>
                    </div>

                     <SectionHeader title={t('moreInfo')} />
                     <div className="space-y-2 text-sm pl-1 mt-2">
                         {/* ... (More info content, tidak berubah) ... */}
                        <a href="https://github.com/Muriarai/ChatNPT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><FiGithub className="w-4 h-4"/> {t('githubRepo')}</a>
                        <a href="#" onClick={(e)=>e.preventDefault()} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-70 cursor-not-allowed" title={t('unavailable')}><FiHelpCircle className="w-4 h-4"/> {t('helpFAQ')}</a>
                        <div className="text-xs text-gray-400 dark:text-gray-500 pt-2">{`${APP_TITLE} - ${t('appVersion')}: ${APP_VERSION}`}</div>
                     </div>
                 </div>
            </BaseModal>

            <ConfirmationModal
                isOpen={confirmDeleteAllOpen}
                onClose={() => setConfirmDeleteAllOpen(false)}
                title={t('deleteAllChats')}
                message={t('deleteAllChatsConfirm')}
                confirmText={t('deleteAction')}
                cancelText={t('cancelAction')}
                onConfirm={confirmDeleteAllAction}
                isDestructive={true}
                t={t}
            />
        </>
    );
});
SettingsModal.displayName = 'SettingsModal';

const LoginPromptModal = React.memo(({ isOpen, onClose, onLoginRegister, t }: LoginPromptModalProps) => {
    // ... (kode komponen LoginPromptModal tidak berubah)
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} titleId="login-title" modalClassName="max-w-sm" t={t}>
            <div className="p-8 text-center">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay: 0.1, type: 'spring', stiffness: 200, damping: 15}} className="mx-auto bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-inner">
                    <FiUser className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                </motion.div>
                <h2 id="login-title" className="text-xl font-semibold mb-3">{t('loginPromptTitle')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('loginPromptDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button onClick={onLoginRegister} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} className="flex-1 px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800">
                        {t('login')}
                    </motion.button>
                    <motion.button onClick={onLoginRegister} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} className="flex-1 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800">
                        {t('signUp')}
                    </motion.button>
                </div>
                <button onClick={onClose} className="mt-6 text-xs text-gray-500 dark:text-gray-400 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded">
                    {t('maybeLater')}
                </button>
            </div>
        </BaseModal>
    );
});
LoginPromptModal.displayName = 'LoginPromptModal';

const ConfirmationModal = React.memo(({
    isOpen, onClose, title, message, confirmText, cancelText, onConfirm, isDestructive = false, t
}: ConfirmationModalProps) => {
    // ... (kode komponen ConfirmationModal tidak berubah)
     const handleConfirm = () => {
         onConfirm();
         onClose();
     };
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} titleId="confirm-title" modalClassName="max-w-sm" t={t}>
             <div className="p-6">
                 <h2 id="confirm-title" className="text-lg font-semibold mb-2">{title}</h2>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                 <div className="flex justify-end gap-3">
                     <motion.button
                         onClick={onClose}
                         whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                         className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
                     >
                         {cancelText}
                     </motion.button>
                     <motion.button
                         onClick={handleConfirm}
                         whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                         className={`px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 ${
                             isDestructive
                                 ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
                                 : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500'
                         }`}
                     >
                         {confirmText}
                     </motion.button>
                 </div>
             </div>
        </BaseModal>
    );
});
ConfirmationModal.displayName = 'ConfirmationModal';


// --- Local Storage Utilities ---
const loadChatHistoryFromStorage = (key: string, t: (key: string) => string, userId?: string): ChatHistoryEntry[] => {
    // TODO: Implement user authentication and store history per user.
    // For now, userId is a placeholder. If provided, a different key could be used.
    const storageKey = userId ? `${LOCALSTORAGE_HISTORY_KEY_BASE}${userId}_v${APP_VERSION}` : key;
    try {
        if (typeof window === 'undefined') return [];
        const storedHistory = localStorage.getItem(storageKey);
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory)) {
                 const validatedHistory = parsedHistory
                    .filter(item => item && item.chatId && Array.isArray(item.messages) && item.createdAt && item.lastUpdatedAt)
                    .map(item => ({
                        appVersionMode: item.appVersionMode || '1.0',
                        isThinkingModeToggleOn: item.isThinkingModeToggleOn ?? false,
                        model1_0Base: item.model1_0Base || DEEPSEEK_V3_MODEL,
                        pinned: item.pinned ?? false, // Add default for pinned
                        archived: item.archived ?? false, // Add default for archived
                        ...item,
                    }));
                // Pinned chats first, then by lastUpdatedAt
                return validatedHistory.sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.lastUpdatedAt - a.lastUpdatedAt;
                });
            } else {
                 console.warn(`Stored history format for key "${storageKey}" is invalid. Resetting.`);
                 localStorage.removeItem(storageKey);
            }
        }
    } catch (error) {
        console.error(`Error loading or parsing chat history for key "${storageKey}":`, error);
    }
    return [];
};

const saveChatHistoryToStorage = (key: string, history: ChatHistoryEntry[], t: (key: string) => string, userId?: string): void => {
    // TODO: Implement user authentication and store history per user.
    const storageKey = userId ? `${LOCALSTORAGE_HISTORY_KEY_BASE}${userId}_v${APP_VERSION}` : key;
    try {
        if (typeof window === 'undefined') return;
        // Ensure history is sorted before saving: Pinned first, then by lastUpdated.
        const sortedHistory = [...history].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.lastUpdatedAt - a.lastUpdatedAt;
        });
        localStorage.setItem(storageKey, JSON.stringify(sortedHistory));
    } catch (error) {
        console.error(`Error saving chat history for key "${storageKey}":`, error);
    }
};

const getDefaultSettings = (): UserSettings => ({
    theme: 'system',
    isStreamingEnabled: false,
    interfaceDensity: 'comfortable',
    autoSuggestEnabled: true,
    language: 'en',
    sendWithCtrlEnter: false,
    showTimestamp: false,
    defaultAppVersionMode: '1.0',
    defaultModel1_0: DEEPSEEK_V3_MODEL,
    enableThinkingModeByDefault1_0: false,
    fontSize: 'medium',
    sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
    showArchivedChats: false, // Default untuk pengaturan baru
});

const loadSettingsFromStorage = (key: string, userId?: string): Partial<UserSettings> => {
    // TODO: Implement user authentication and store settings per user.
    const storageKey = userId ? `${LOCALSTORAGE_SETTINGS_KEY_BASE}${userId}_v${APP_VERSION}` : key;
    try {
        if (typeof window === 'undefined') return {};
        const storedSettings = localStorage.getItem(storageKey);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            const defaultSettings = getDefaultSettings();
            const loaded: Partial<UserSettings> = {};
            (Object.keys(defaultSettings) as (keyof UserSettings)[]).forEach(settingKey => {
                if (Object.prototype.hasOwnProperty.call(parsed, settingKey) && parsed[settingKey] !== undefined && parsed[settingKey] !== null) {
                    if (settingKey === 'sidebarWidth') {
                        loaded[settingKey] = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed[settingKey] || defaultSettings[settingKey]));
                    } else {
                        loaded[settingKey] = parsed[settingKey];
                    }
                } else {
                    loaded[settingKey] = defaultSettings[settingKey];
                }
            });
            return loaded;
        }
    } catch (error) {
        console.error(`Error loading settings for key "${storageKey}":`, error);
    }
    return getDefaultSettings();
};

const saveSettingsToStorage = (key: string, settings: UserSettings, userId?: string): void => {
    // TODO: Implement user authentication and store settings per user.
    const storageKey = userId ? `${LOCALSTORAGE_SETTINGS_KEY_BASE}${userId}_v${APP_VERSION}` : key;
    try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (error) {
        console.error(`Error saving settings for key "${storageKey}":`, error);
    }
};

const generateChatTitle = (messages: DisplayedChatMessage[], fallbackTitle: string): string => {
    // ... (kode fungsi generateChatTitle tidak berubah)
    const firstUserMessage = messages.find(m => m.speaker === 'user' && typeof m.text === 'string' && m.text.trim());
    if (firstUserMessage && typeof firstUserMessage.text === 'string') {
        const title = firstUserMessage.text.split('\n')[0]; // First line
        return title.substring(0, MAX_TITLE_LENGTH) + (title.length > MAX_TITLE_LENGTH ? '...' : '');
    }
    return fallbackTitle;
};

const formatTimestampRelative = (timestamp: number, lang: Language): string => {
    // ... (kode fungsi formatTimestampRelative tidak berubah)
     const now = new Date();
     const date = new Date(timestamp);
     const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
     const diffMinutes = Math.round(diffSeconds / 60);
     const diffHours = Math.round(diffMinutes / 60);
     const diffDays = Math.round(diffHours / 24);

     const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

     if (diffSeconds < 10) return rtf.format(0, 'second');
     if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
     if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
     if (diffHours < 24) return rtf.format(-diffHours, 'hour');
     if (diffDays < 7) return rtf.format(-diffDays, 'day');

     return date.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined });
};


// --- Main Chat Page Component ---
export default function ChatNPT(): JSX.Element {
    const [settings, setSettingsState] = useState<UserSettings>(getDefaultSettings());
    const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
    const [isHistoryInitialized, setIsHistoryInitialized] = useState(false);
    const [loadedTranslations, setLoadedTranslations] = useState<Record<string, string>>({});
    const [isAuthInitialized, setIsAuthInitialized] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
    const [currentActiveChatId, setCurrentActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayedChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Akan dikontrol oleh Firebase
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Placeholder
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationProps, setConfirmationProps] = useState<Omit<ConfirmationModalProps, 'isOpen' | 'onClose' | 't'>>({ title: '', message: '', confirmText: '', cancelText: '', onConfirm: () => {}});

    const [tempInitialPrompt, setTempInitialPrompt] = useState<string | null>(null);
    const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);

    const [currentChatAppVersionMode, setCurrentChatAppVersionMode] = useState<AppVersionMode>('1.0');
    const [currentChatIsThinkingModeToggleOn, setCurrentChatIsThinkingModeToggleOn] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);

    // State for chat item dropdown menu
    const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);
    const chatMenuItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});


    const isThinkingModeActiveForCurrentChat = useMemo(() => {
         return currentChatAppVersionMode === '1.5' || currentChatIsThinkingModeToggleOn;
    }, [currentChatAppVersionMode, currentChatIsThinkingModeToggleOn]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const isResizingSidebar = useRef(false);

    const router = useRouter();
    useEffect(() => {
        if (!isSettingsInitialized || !settings.language) return;

        const loadTranslations = async (lang: Language) => {
            try {
                const module = await import(`../../locales/${lang}.ts`);
                setLoadedTranslations(module.localeTranslations || {});
            } catch (error) {
                console.error(`Failed to load translations for ${lang}:`, error);
                if (lang !== 'en') {
                    try {
                        console.log("Attempting to load English fallback translations.");
                        const fallbackModule = await import(`../../locales/${lang}.ts`);
                        setLoadedTranslations(fallbackModule.localeTranslations || {});
                    } catch (fallbackError) {
                        console.error("Failed to load English fallback translations:", fallbackError);
                        setLoadedTranslations({}); // Fallback to empty if English also fails
                    }
                } else {
                    setLoadedTranslations({}); // Fallback to empty if English fails
                }
            }
        };

        loadTranslations(settings.language);
    }, [settings.language, isSettingsInitialized]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setUserProfile({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || 'User',
                    email: firebaseUser.email || 'No email',
                    avatarUrl: firebaseUser.photoURL || undefined,
                });
                setIsLoggedIn(true);
            } else {
                setUserProfile(null);
                setIsLoggedIn(false);
                // Jika pengguna tidak login dan mencoba mengakses halaman chat, redirect ke halaman auth
                // Kecuali jika ini adalah proses logout yang baru saja terjadi
                if (isAuthInitialized) { // Hanya redirect jika auth sudah diinisialisasi sebelumnya
                    router.push('/auth');
                }
            }
            setIsAuthInitialized(true);
        });
        return () => unsubscribe();
    }, [router, isAuthInitialized]); // isAuthInitialized ditambahkan untuk mencegah redirect prematur

    const t = useCallback((key: string, params?: Record<string, string>): string => {
        // ... (fungsi t tidak berubah)
        let text = loadedTranslations[key] || key; // Fallback to key itself if not found
         if (params) {
              Object.keys(params).forEach(paramKey => {
                const value = params[paramKey];
                text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), value !== undefined && value !== null ? String(value) : '');
           });
         }
         return text;
    }, [loadedTranslations]);

     const applyThemePreference = useCallback((theme: 'light' | 'dark' | 'system') => {
        // ... (fungsi applyThemePreference tidak berubah)
         if (typeof window !== 'undefined') {
             const root = document.documentElement;
             root.classList.remove('light', 'dark');
             let effectiveTheme = theme;
             if (theme === 'system') {
                 effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
             }
             root.classList.add(effectiveTheme);
         }
     }, []);

     const updateSettings = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettingsState(prev => {
            // ... (fungsi updateSettings tidak berubah signifikan, hanya save dengan userId jika ada)
            const newSettings = { ...prev, [key]: value };
            if (key === 'theme') {
                 applyThemePreference(value as 'light' | 'dark' | 'system');
            }
             if (key === 'defaultAppVersionMode' && !currentActiveChatId) {
                 setCurrentChatAppVersionMode(value as AppVersionMode);
                 if (value === '1.0') {
                      setCurrentChatIsThinkingModeToggleOn(newSettings.enableThinkingModeByDefault1_0);
                 } else {
                      setCurrentChatIsThinkingModeToggleOn(false);
                 }
             }
             if (key === 'enableThinkingModeByDefault1_0' && !currentActiveChatId && currentChatAppVersionMode === '1.0') {
                  setCurrentChatIsThinkingModeToggleOn(value as boolean);
             }
            saveSettingsToStorage(LOCALSTORAGE_SETTINGS_KEY, newSettings, userProfile?.id); // Pass userProfile.id
            return newSettings;
        });
    }, [applyThemePreference, currentActiveChatId, currentChatAppVersionMode, userProfile?.id]); // Add userProfile.id dependency

    useEffect(() => {
        // ... (useEffect untuk deteksi mobile view tidak berubah)
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < MOBILE_BREAKPOINT);
        };
        if (typeof window !== 'undefined') {
            checkMobileView();
            window.addEventListener('resize', checkMobileView);
            return () => window.removeEventListener('resize', checkMobileView);
        }
    }, []);

    useEffect(() => {
        // ... (useEffect untuk sidebar state on mobile tidak berubah)
        if (isSettingsInitialized) {
            if (isMobileView) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(prev => isMobileView ? false : (prev ?? true));
            }
        }
    }, [isMobileView, isSettingsInitialized]);

     useEffect(() => {
         // Load settings, now potentially per-user if userProfile.id is available
         const loadedSettings = loadSettingsFromStorage(LOCALSTORAGE_SETTINGS_KEY, userProfile?.id);
         const finalSettings = { ...getDefaultSettings(), ...loadedSettings };
         finalSettings.sidebarWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalSettings.sidebarWidth || DEFAULT_SIDEBAR_WIDTH));

         setSettingsState(finalSettings);
         setCurrentChatAppVersionMode(finalSettings.defaultAppVersionMode);
         setCurrentChatIsThinkingModeToggleOn(finalSettings.enableThinkingModeByDefault1_0);
         applyThemePreference(finalSettings.theme);
         setIsSettingsInitialized(true);

         const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
         const handleChange = () => { if (settings.theme === 'system') applyThemePreference('system'); };
         mediaQuery.addEventListener('change', handleChange);
         return () => mediaQuery.removeEventListener('change', handleChange);
     }, [applyThemePreference, userProfile?.id, settings.theme]); // settings.theme dibutuhkan di sini agar listener theme OS sinkron

     const settingsContextValue: SettingsContextType = useMemo(() => ({
         settings, updateSettings, t
     }), [settings, updateSettings, t]);

    const generateTitleWithAI = useCallback(async (promptText: string): Promise<string> => {
        // ... (fungsi generateTitleWithAI tidak berubah)
        const titlePrompt = `Generate a concise and relevant title (maximum 5 words, ideally 2-3 words) for a conversation starting with the following user message. The title should be in the same language as the user's message if possible, otherwise default to English. Do not use quotes or any special formatting for the title itself. User message: "${promptText.substring(0, 200)}"`;
        const modelForTitle = DEEPSEEK_V3_MODEL;

        try {
            console.log("Requesting AI title generation for:", promptText.substring(0, 50) + "...");
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: modelForTitle,
                    messages: [{ role: "user", content: titlePrompt }],
                    stream: false, max_tokens: 20, temperature: 0.3,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`AI title generation failed: ${response.status} ${response.statusText}`, errorBody);
                throw new Error(`API error for title: ${response.status}`);
            }

            const data = await response.json();
            let generatedTitle = data.choices?.[0]?.message?.content?.trim() || "";
            generatedTitle = generatedTitle.replace(/["'\n]/g, "").trim();
            if (generatedTitle.length > MAX_TITLE_LENGTH) {
                generatedTitle = generatedTitle.substring(0, MAX_TITLE_LENGTH) + "...";
            }
            if (!generatedTitle) {
                 console.warn("AI generated an empty title. Using fallback.");
                 return generateChatTitle([{ id: 'temp', speaker: 'user', text: promptText, timestamp: Date.now(), fullText: promptText }], t('untitledChat'));
            }
            console.log("AI Generated Title:", generatedTitle);
            return generatedTitle;
        } catch (error) {
            console.error("Error in generateTitleWithAI, using fallback:", error);
            return generateChatTitle([{ id: 'temp', speaker: 'user', text: promptText, timestamp: Date.now(), fullText: promptText }], t('untitledChat'));
        }
    }, [t]);

     useEffect(() => {
         // Load history after settings are initialized and userProfile is potentially available
         if (isSettingsInitialized) { // userProfile.id dependency akan memicu ini jika login state berubah
             const loadedHistory = loadChatHistoryFromStorage(LOCALSTORAGE_HISTORY_KEY, t, userProfile?.id);
             setChatHistory(loadedHistory);
             if (loadedHistory.length > 0) {
                 const activeChats = loadedHistory.filter(c => !c.archived);
                 if (activeChats.length > 0) {
                    loadChat(activeChats[0].chatId, loadedHistory);
                 } else if (loadedHistory.length > 0) { // Semua chat diarsipkan, muat yang pertama (akan tersembunyi jika showArchived false)
                    loadChat(loadedHistory[0].chatId, loadedHistory);
                 } else {
                    handleNewChat(true);
                 }
             } else {
                 handleNewChat(true);
             }
             setIsHistoryInitialized(true);
         }
     }, [isSettingsInitialized, userProfile?.id, t]); // Removed loadChat, handleNewChat dependencies to avoid loops


     const handleNewChat = useCallback((isInitialLoad = false) => {
        // ... (fungsi handleNewChat tidak berubah signifikan)
        if (isGenerating) return;
        setIsLoadingChat(true);
        const newChatId = uuidv4();
        const now = Date.now();
        const defaultMode = settings.defaultAppVersionMode;
        const defaultThinking = defaultMode === '1.0' ? settings.enableThinkingModeByDefault1_0 : false;
        const welcomeMessage: DisplayedChatMessage = {
            id: uuidv4(), speaker: 'ai', text: t('aiWelcome'), fullText: t('aiWelcome'),
            isCurrentGeneration: true, generationIndex: 0, totalGenerations: 1,
            isStreaming: false, isGenerating: false, wasCancelled: false, timestamp: now,
            modelUsed: defaultMode === '1.0' ? settings.defaultModel1_0 : QWEN_235B_MODEL
        };
        const newEntry: ChatHistoryEntry = {
            chatId: newChatId, title: null, messages: [welcomeMessage],
            createdAt: now, lastUpdatedAt: now,
            appVersionMode: defaultMode,
            isThinkingModeToggleOn: defaultThinking,
            model1_0Base: settings.defaultModel1_0,
            pinned: false, archived: false, // Defaults for new properties
            userId: userProfile?.id, // Associate with user if logged in
        };

        setMessages([welcomeMessage]);
        setCurrentActiveChatId(newChatId);
        setCurrentInput('');
        setCurrentChatAppVersionMode(defaultMode);
        setCurrentChatIsThinkingModeToggleOn(defaultThinking);

        setChatHistory(prev => {
            const newState = [newEntry, ...prev];
            // Sort again to ensure pinned items are on top if any exist.
            newState.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.lastUpdatedAt - a.lastUpdatedAt; // Secondary sort by time
            });
            saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, newState, t, userProfile?.id);
            return newState;
        });

        setIsLoadingChat(false);
        if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
        if (!isInitialLoad) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                 chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                 textareaRef.current?.focus();
            }));
        }
    }, [isGenerating, t, settings, userProfile?.id, isMobileView, isSidebarOpen]);

    const loadChat = useCallback((chatId: string, sourceHistory?: ChatHistoryEntry[]) => {
        // ... (fungsi loadChat tidak berubah signifikan)
        if (chatId === currentActiveChatId || isLoadingChat || isGenerating) return;
        setIsLoadingChat(true);

        const historyToSearch = sourceHistory || chatHistory;
        const chatToLoad = historyToSearch.find(entry => entry.chatId === chatId);

        if (chatToLoad) {
             const loadedMessages = chatToLoad.messages.map(msg => ({ ...msg }));
             setMessages(loadedMessages);
             setCurrentActiveChatId(chatId);
             setCurrentInput('');
             setCurrentChatAppVersionMode(chatToLoad.appVersionMode);
             setCurrentChatIsThinkingModeToggleOn(chatToLoad.isThinkingModeToggleOn);

             const now = Date.now();
             setChatHistory(prev => {
                 const updatedHistory = prev.map(entry =>
                     entry.chatId === chatId ? { ...entry, lastUpdatedAt: now } : entry
                 );
                 updatedHistory.sort((a, b) => { // Re-sort after updating time
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.lastUpdatedAt - a.lastUpdatedAt;
                 });
                 saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, updatedHistory, t, userProfile?.id);
                 return updatedHistory;
             });

             if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
             requestAnimationFrame(() => requestAnimationFrame(() => {
                 chatEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
                 textareaRef.current?.focus();
             }));
        } else {
            console.error(`Chat with ID ${chatId} not found.`);
            handleNewChat();
        }
        setIsLoadingChat(false);
    }, [currentActiveChatId, isLoadingChat, isGenerating, chatHistory, handleNewChat, t, userProfile?.id, isMobileView, isSidebarOpen]);


    const saveMessagesToHistory = useCallback((
        chatId: string,
        updatedMessages: DisplayedChatMessage[],
        mode: AppVersionMode,
        thinkingToggleState: boolean,
        baseModel1_0: string,
        explicitTitleArg?: string | null
    ) => {
         setChatHistory(prevHistory => {
            // ... (fungsi saveMessagesToHistory tidak berubah signifikan, hanya save dengan userId)
            let chatExists = false;
            const now = Date.now();
            const updatedFullHistory = prevHistory.map(entry => {
                if (entry.chatId === chatId) {
                    chatExists = true;
                    const finalTitle = explicitTitleArg !== undefined
                        ? explicitTitleArg
                        : (entry.title || generateChatTitle(updatedMessages, t('untitledChat')));
                    return {
                        ...entry,
                        messages: updatedMessages,
                        title: finalTitle,
                        lastUpdatedAt: now,
                        appVersionMode: mode,
                        isThinkingModeToggleOn: thinkingToggleState,
                        model1_0Base: baseModel1_0,
                        // Pinned and archived status are preserved from entry
                    };
                }
                return entry;
            });

             if (!chatExists) {
                  console.warn(`Attempted to save messages for non-existent chatId: ${chatId}. This might be an issue if not the first message of a new chat.`);
                  return prevHistory; // Should not happen if new chat is added first
             }

            updatedFullHistory.sort((a, b) => { // Re-sort after update
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.lastUpdatedAt - a.lastUpdatedAt;
            });
            saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, updatedFullHistory, t, userProfile?.id);
            return updatedFullHistory;
         });
    }, [t, userProfile?.id, generateChatTitle]);


     const handleDeleteChat = useCallback((chatIdToDelete: string) => {
         // ... (fungsi handleDeleteChat tidak berubah signifikan)
         setChatHistory(prev => {
            const updatedHistory = prev.filter(entry => entry.chatId !== chatIdToDelete);
            saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, updatedHistory, t, userProfile?.id);
            return updatedHistory;
         });

         if (currentActiveChatId === chatIdToDelete) {
             const remainingHistory = chatHistory.filter(entry => entry.chatId !== chatIdToDelete && !entry.archived); // Consider non-archived for next active
             const remainingArchived = chatHistory.filter(entry => entry.chatId !== chatIdToDelete && entry.archived);

             if (remainingHistory.length > 0) {
                 loadChat(remainingHistory.sort((a,b) => {
                    if(a.pinned && !b.pinned) return -1; if(!a.pinned && b.pinned) return 1; return b.lastUpdatedAt - a.lastUpdatedAt;
                 })[0].chatId);
             } else if (remainingArchived.length > 0 && settings.showArchivedChats) { // If only archived left and they are shown
                 loadChat(remainingArchived.sort((a,b) => b.lastUpdatedAt - a.lastUpdatedAt)[0].chatId);
             } else {
                 handleNewChat();
             }
         }
     }, [currentActiveChatId, chatHistory, t, loadChat, handleNewChat, userProfile?.id, settings.showArchivedChats]);

      const confirmDeleteChat = useCallback((chatId: string, title: string | null) => {
           setConfirmationProps({
               title: t('deleteChatTitle'),
               message: `${t('deleteChatConfirm')} "${title || t('untitledChat')}"? ${t('confirmDeleteMessage')}`,
               confirmText: t('deleteAction'),
               cancelText: t('cancelAction'),
               onConfirm: () => handleDeleteChat(chatId),
               isDestructive: true,
           });
           setIsConfirmationModalOpen(true);
       }, [t, handleDeleteChat]);

    // --- New Chat Action Handlers ---
    const handleDeleteAllChats = useCallback(() => {
        setChatHistory([]);
        saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, [], t, userProfile?.id);
        handleNewChat(true); // Start a fresh chat
        console.log("All chats deleted.");
    }, [t, userProfile?.id, handleNewChat]);

    const handleToggleArchiveChat = useCallback((chatId: string) => {
        setChatHistory(prev => {
            const updatedHistory = prev.map(chat =>
                chat.chatId === chatId ? { ...chat, archived: !chat.archived, lastUpdatedAt: Date.now() } : chat
            );
            // Re-sort, archived status doesn't change primary sort order (pinned > time)
            // But lastUpdatedAt change might affect its position within unpinned/pinned groups
            updatedHistory.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.lastUpdatedAt - a.lastUpdatedAt;
            });
            saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, updatedHistory, t, userProfile?.id);

            // If archiving the current chat, load another or new
            if (chatId === currentActiveChatId && !updatedHistory.find(c => c.chatId === chatId)?.archived === false) { // if it became archived
                const nextChat = updatedHistory.find(c => !c.archived && c.chatId !== chatId) || updatedHistory.find(c => !c.archived);
                if (nextChat) {
                    loadChat(nextChat.chatId, updatedHistory);
                } else {
                    handleNewChat();
                }
            }
            return updatedHistory;
        });
        setActiveChatMenu(null); // Close menu
    }, [t, userProfile?.id, currentActiveChatId, loadChat, handleNewChat]);

    const handleTogglePinChat = useCallback((chatId: string) => {
        setChatHistory(prev => {
            const updatedHistory = prev.map(chat =>
                chat.chatId === chatId ? { ...chat, pinned: !chat.pinned, lastUpdatedAt: Date.now() } : chat
            );
            // Re-sort is crucial here as pinning changes sort order
            updatedHistory.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.lastUpdatedAt - a.lastUpdatedAt;
            });
            saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, updatedHistory, t, userProfile?.id);
            return updatedHistory;
        });
        setActiveChatMenu(null); // Close menu
    }, [t, userProfile?.id]);


    const fetchAndStreamResponse = useCallback(async (
        // ... (parameter list tidak berubah) ...
        userPromptMessage: DisplayedChatMessage, messageHistoryForApi: ApiMessage[], targetAiMessageId: string,
        generationIndex: number = 0, chatIdForApi: string, chatAppVersionMode: AppVersionMode,
        chatIsThinkingModeToggleOn: boolean, chatModel1_0Base: string,
        initialMessagesForResponseCycle: DisplayedChatMessage[] // New parameter
    ) => {
        // ... (seluruh isi fungsi fetchAndStreamResponse tidak berubah signifikan)
        // Hanya pastikan saveMessagesToHistory dipanggil dengan userProfile?.id jika ada
        if (isGenerating) { console.warn("Generation request ignored: already generating."); return; }

        const useThinkingModePrompt = chatAppVersionMode === '1.5' || chatIsThinkingModeToggleOn;
        const modelToUse = chatAppVersionMode === '1.5'
            ? QWEN_235B_MODEL
            : (chatIsThinkingModeToggleOn ? DEEPSEEK_R1_MODEL : chatModel1_0Base);

        const systemPromptContent = useThinkingModePrompt
            ? `You are ${APP_TITLE}, an advanced AI assistant by ${APP_AUTHOR}. Prioritize step-by-step thinking before the final answer. Enclose your detailed reasoning process within <think>...</think> tags. After the closing </think> tag, provide the final, comprehensive answer. Be thorough and clear.`
            : `You are ${APP_TITLE}, a helpful AI assistant by ${APP_AUTHOR}. Provide clear and concise answers directly.`;
        const apiMessages = [{ role: "system" as const, content: systemPromptContent }, ...messageHistoryForApi];

        const newAbortController = new AbortController();
        setAbortController(newAbortController);
        setIsGenerating(true);
        setGeneratingMessageId(targetAiMessageId);

        const aiMessageTimestamp = Date.now();
        const aiThinkingMessageId = `thinking_${targetAiMessageId}`;
        let finalMessagesSnapshot: DisplayedChatMessage[] = [];

        // Define the function to construct messages with placeholders
        const constructInitialMessagesWithPlaceholders = () => {
            let workArray = [...initialMessagesForResponseCycle];
            workArray = workArray.filter(m => !(m.speaker === 'thinking' && m.userPromptId === userPromptMessage.id && m.generationIndex === generationIndex));
            const totalGenerationsSoFar = generationIndex + 1;
            const placeholderAiMessage: DisplayedChatMessage = {
                id: targetAiMessageId, speaker: 'ai', text: '', fullText: '', isStreaming: true, isGenerating: true, wasCancelled: false,
                userPromptId: userPromptMessage.id, generationIndex: generationIndex, isCurrentGeneration: true, totalGenerations: totalGenerationsSoFar,
                timestamp: aiMessageTimestamp, modelUsed: modelToUse, thinkingSteps: []
            };
            workArray = workArray.map(msg => {
                if (msg.speaker === 'ai' && msg.userPromptId === userPromptMessage.id && msg.id !== targetAiMessageId) {
                    return { ...msg, isCurrentGeneration: false, totalGenerations: Math.max(msg.totalGenerations ?? 0, totalGenerationsSoFar) };
                }
                return msg;
            });
            const existingMsgIndex = workArray.findIndex(m => m.id === targetAiMessageId);
            if (existingMsgIndex > -1) {
               workArray[existingMsgIndex] = placeholderAiMessage;
            } else {
                workArray.push(placeholderAiMessage);
            }

            if (useThinkingModePrompt) {
                const newThinkingBubble: DisplayedChatMessage = {
                    id: aiThinkingMessageId, speaker: 'thinking', text: [], type: 'thinking', isStreaming: true, userPromptId: userPromptMessage.id,
                    generationIndex: generationIndex, timestamp: aiMessageTimestamp, modelUsed: modelToUse, isCurrentGeneration: true
                };
                const insertionIndex = workArray.findIndex(m => m.id === targetAiMessageId);
                if (insertionIndex > -1) {
                    workArray.splice(insertionIndex, 0, newThinkingBubble); // Insert before AI message
                } else {
                    console.warn("AI placeholder not found for thinking bubble insertion, appending thinking bubble.");
                    workArray.push(newThinkingBubble); // Should ideally not happen
                }
            }
            workArray.sort((a, b) => {
                if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
                if (a.userPromptId === b.userPromptId && a.userPromptId !== undefined) {
                    const speakerOrder: Record<SpeakerRole, number> = { user: 0, thinking: 1, ai: 2, error: 3 };
                    if (speakerOrder[a.speaker] !== speakerOrder[b.speaker]) return speakerOrder[a.speaker] - speakerOrder[b.speaker];
                    if (a.generationIndex !== undefined && b.generationIndex !== undefined && a.generationIndex !== b.generationIndex) return (a.generationIndex ?? 0) - (b.generationIndex ?? 0);
                }
                return 0;
            });
            return workArray;
        };
        // Call setMessages directly with the result of the constructor function
        setMessages(constructInitialMessagesWithPlaceholders());

        let accumulatedFinalAnswer = "";
        let accumulatedThinkingLines: string[] = [];
        let partialThinkingLine = "";
        let unprocessedChunkPart = "";
        let lastUpdateTime = 0;
        let isParsingThinkingSection = false;

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify({ model: modelToUse, messages: apiMessages, stream: true, max_tokens: useThinkingModePrompt ? 3072 : 1536, temperature: 0.6 }),
                signal: newAbortController.signal,
            });

            if (!response.ok || !response.body) {
                 let errorBodyText = "Unknown error from proxy.";
                 try { const errorJson = await response.json(); errorBodyText = errorJson.error || errorJson.details || JSON.stringify(errorJson); } catch { try { errorBodyText = await response.text(); } catch {} }
                 const errorMessage = `${t('apiErrorWithMessage')} (Proxy): ${response.status} ${response.statusText}. Details: ${errorBodyText.substring(0, 150)}${errorBodyText.length > 150 ? '...' : ''}`;
                 throw new Error(errorMessage);
            }

            const reader = response.body.getReader(); const decoder = new TextDecoder(); let streamDone = false;

            while (!streamDone) {
                const { value, done } = await reader.read(); streamDone = done;
                const rawChunk = decoder.decode(value, { stream: !streamDone });
                let currentChunkProcessing = unprocessedChunkPart + rawChunk; unprocessedChunkPart = "";
                const lines = currentChunkProcessing.split('\n');
                let needsStateUpdate = false;

                 for (let i = 0; i < lines.length; i++) {
                     const line = lines[i].trim();
                     if (i === lines.length - 1 && !streamDone && line) {
                          if (line.startsWith("data:")) { try { const jsonStringTest = line.substring(5).trim(); if (jsonStringTest !== '[DONE]') JSON.parse(jsonStringTest); } catch (e) { unprocessedChunkPart = line; continue; } }
                          else if (line) { unprocessedChunkPart = line; continue; }
                     }
                     if (!line) continue;
                     if (line === "data: [DONE]") { streamDone = true; if (partialThinkingLine.trim()) accumulatedThinkingLines.push(partialThinkingLine); partialThinkingLine = ""; needsStateUpdate = true; break; }
                     if (line.startsWith("data:")) {
                         const jsonString = line.substring(5).trim();
                         if (jsonString) {
                             try {
                                 const data = JSON.parse(jsonString); const deltaContent = data.choices?.[0]?.delta?.content ?? "";
                                 if (deltaContent) {
                                     let currentPos = 0;
                                     while (currentPos < deltaContent.length) {
                                         if (useThinkingModePrompt) {
                                             if (!isParsingThinkingSection) {
                                                 const thinkStartTagPos = deltaContent.indexOf("<think>", currentPos);
                                                 if (thinkStartTagPos !== -1) {
                                                     accumulatedFinalAnswer += deltaContent.substring(currentPos, thinkStartTagPos);
                                                     isParsingThinkingSection = true;
                                                     currentPos = thinkStartTagPos + "<think>".length;
                                                 } else {
                                                     accumulatedFinalAnswer += deltaContent.substring(currentPos);
                                                     currentPos = deltaContent.length;
                                                 }
                                             } else {
                                                 const thinkEndTagPos = deltaContent.indexOf("</think>", currentPos);
                                                 if (thinkEndTagPos !== -1) {
                                                     const thinkingPart = deltaContent.substring(currentPos, thinkEndTagPos);
                                                     const combinedThinking = partialThinkingLine + thinkingPart;
                                                     const newLines = combinedThinking.split('\n');
                                                     newLines.forEach((newLine, index) => {
                                                         if (index === newLines.length - 1) partialThinkingLine = newLine;
                                                         else if (newLine.trim()) accumulatedThinkingLines.push(newLine.trim());
                                                     });
                                                     isParsingThinkingSection = false;
                                                     currentPos = thinkEndTagPos + "</think>".length;
                                                     accumulatedFinalAnswer += deltaContent.substring(currentPos);
                                                 } else {
                                                     const thinkingPart = deltaContent.substring(currentPos);
                                                     const combinedThinking = partialThinkingLine + thinkingPart;
                                                     const newLines = combinedThinking.split('\n');
                                                     newLines.forEach((newLine, index) => {
                                                          if (index === newLines.length - 1) partialThinkingLine = newLine;
                                                         else if (newLine.trim()) accumulatedThinkingLines.push(newLine.trim());
                                                     });
                                                     currentPos = deltaContent.length;
                                                 }
                                             }
                                         } else {
                                             accumulatedFinalAnswer += deltaContent.substring(currentPos);
                                             currentPos = deltaContent.length;
                                         }
                                     }
                                     needsStateUpdate = true;
                                 }
                             } catch (e) { console.error("Error parsing stream JSON:", e, "Line:", line); }
                         }
                     }
                 }

                const now = Date.now();
                if (needsStateUpdate && (now - lastUpdateTime > STREAM_UPDATE_INTERVAL || streamDone)) {
                    const finalAnswerSnapshot = accumulatedFinalAnswer;
                    const thinkingLinesSnapshot = [...accumulatedThinkingLines, partialThinkingLine.trim()].filter(Boolean);
                    const isStreamingUpdate = !streamDone;

                    setMessages(prev => prev.map(msg => {
                        if (msg.id === targetAiMessageId) {
                           return { ...msg, text: finalAnswerSnapshot, fullText: finalAnswerSnapshot, isStreaming: isStreamingUpdate, isGenerating: isStreamingUpdate };
                        }
                        if (msg.id === aiThinkingMessageId && msg.speaker === 'thinking' && msg.userPromptId === userPromptMessage.id && msg.generationIndex === generationIndex) {
                             return { ...msg, text: thinkingLinesSnapshot, isStreaming: isStreamingUpdate };
                        }
                        return msg;
                    }));
                    lastUpdateTime = now;
                    needsStateUpdate = false;

                    if ((!isSidebarOpen || isMobileView)) {
                         requestAnimationFrame(() => requestAnimationFrame(() => {
                             chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                         }));
                    }
                }
                if (streamDone) break;
            }

             if (partialThinkingLine.trim()) accumulatedThinkingLines.push(partialThinkingLine);
             const finalThinkingLines = [...accumulatedThinkingLines].filter(Boolean);
             const trimmedFinalAnswer = accumulatedFinalAnswer.trim();

             setMessages(prevMessages => {
                 const relatedAis = prevMessages.filter(m => (m.speaker === 'ai' || m.speaker === 'error') && m.userPromptId === userPromptMessage.id);
                 const finalTotalGens = Math.max(1, relatedAis.length);

                 const finalUpdatedMessages = prevMessages.map(msg => {
                    let updatedMsg = { ...msg };
                    if (updatedMsg.id === targetAiMessageId) {
                        updatedMsg = { ...updatedMsg, text: trimmedFinalAnswer, fullText: trimmedFinalAnswer, isStreaming: false, isGenerating: false, wasCancelled: false, isCurrentGeneration: true, totalGenerations: finalTotalGens, thinkingSteps: finalThinkingLines };
                    } else if (updatedMsg.id === aiThinkingMessageId && updatedMsg.speaker === 'thinking' && updatedMsg.userPromptId === userPromptMessage.id && updatedMsg.generationIndex === generationIndex) {
                        updatedMsg = { ...updatedMsg, text: finalThinkingLines, isStreaming: false };
                    } else if ((updatedMsg.speaker === 'ai' || updatedMsg.speaker === 'error') && updatedMsg.userPromptId === userPromptMessage.id && updatedMsg.id !== targetAiMessageId) {
                        updatedMsg = { ...updatedMsg, isCurrentGeneration: false, totalGenerations: finalTotalGens };
                    }
                    return updatedMsg;
                 });
                 finalMessagesSnapshot = finalUpdatedMessages;
                 return finalUpdatedMessages;
             });

        } catch (error: any) {
             console.error("API request/stream failed (via proxy):", error);
             const isAbort = error.name === 'AbortError';
             if (partialThinkingLine.trim()) accumulatedThinkingLines.push(partialThinkingLine);
             const finalThinkingLinesOnError = [...accumulatedThinkingLines].filter(Boolean);
             const errorTimestamp = Date.now();

             setMessages(prevMessages => {
                  const relatedAis = prevMessages.filter(m => (m.speaker === 'ai' || m.speaker === 'error') && m.userPromptId === userPromptMessage.id);
                  const finalTotalGens = Math.max(1, relatedAis.length);
                 const finalErrorMessages = prevMessages.map(msg => {
                    let updatedMsg = { ...msg };
                    if (updatedMsg.id === targetAiMessageId) {
                        const errorOrCancelText = isAbort
                            ? (accumulatedFinalAnswer.trim() || t('cancelledPrefix'))
                            : `${t('errorPrefix')} ${error.message.includes('(Proxy)') ? error.message : t('fetchFailed')}`;
                        updatedMsg = { ...updatedMsg, speaker: 'error', text: errorOrCancelText, fullText: errorOrCancelText, isStreaming: false, isGenerating: false, wasCancelled: isAbort, totalGenerations: finalTotalGens, thinkingSteps: finalThinkingLinesOnError, timestamp: errorTimestamp };
                    }
                    if (updatedMsg.id === aiThinkingMessageId && updatedMsg.speaker === 'thinking' && updatedMsg.userPromptId === userPromptMessage.id && updatedMsg.generationIndex === generationIndex) {
                         updatedMsg = { ...updatedMsg, text: finalThinkingLinesOnError, isStreaming: false };
                    }
                    if ((updatedMsg.speaker === 'ai' || updatedMsg.speaker === 'error') && updatedMsg.userPromptId === userPromptMessage.id && updatedMsg.id !== targetAiMessageId) {
                         updatedMsg = { ...updatedMsg, isCurrentGeneration: false, totalGenerations: finalTotalGens };
                    }
                    return updatedMsg;
                 });
                 finalMessagesSnapshot = finalErrorMessages;
                 return finalErrorMessages;
             });
             if (isAbort) console.log("API request cancelled.");

        } finally {
            setIsGenerating(false);
            setGeneratingMessageId(null);
            setAbortController(null);
            if (chatIdForApi && finalMessagesSnapshot.length > 0) {
                 const currentChatEntry = chatHistory.find(c => c.chatId === chatIdForApi);
                 // Pass currentChatAppVersionMode, etc. as these are tied to the chat at the moment of generation
                 saveMessagesToHistory(chatIdForApi, finalMessagesSnapshot, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn, currentChatEntry?.model1_0Base || settings.defaultModel1_0);
            }
            requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${(textareaRef.current as any).minHeight || '48px'}`; } });
        }
    }, [isGenerating, messages, t, saveMessagesToHistory, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn, chatHistory, settings.defaultModel1_0, isSidebarOpen, isMobileView]);


    const handleSendMessage = useCallback(async () => {
        // ... (fungsi handleSendMessage tidak berubah signifikan)
        const userText = currentInput.trim();
        if (!userText || !currentActiveChatId) return;
        if (isGenerating) return;

        // Limit AI responses to 2 for ChatNPT 1.5 mode
        const currentChatEntry = chatHistory.find(c => c.chatId === currentActiveChatId);
        if (currentChatEntry?.appVersionMode === '1.5') {
            const aiMessagesCount = messages.filter(m => m.speaker === 'ai' || m.speaker === 'error').length;
            if (aiMessagesCount >= 2) {
                console.warn("ChatNPT 1.5 mode is limited to 2 AI responses per chat.");
                return; // Stop sending if limit reached
            }
        }

        const userMessageTimestamp = Date.now();
        const userPromptId = uuidv4();
        const newUserMessage: DisplayedChatMessage = {
            id: userPromptId, speaker: 'user', text: userText,
            timestamp: userMessageTimestamp, fullText: userText
        };
        const newAiMessageId = uuidv4();
        const chatIdForAPI = currentActiveChatId;

        const messagesBeforeUser = messages;
        const modeBeforeSend = currentChatAppVersionMode;
        const thinkingToggleStateBeforeSend = currentChatIsThinkingModeToggleOn;
        const chatEntryForSend = chatHistory.find(c => c.chatId === currentActiveChatId);
        const baseModel1_0BeforeSend = chatEntryForSend?.model1_0Base || settings.defaultModel1_0;

        const updatedMessagesWithUser = [...messagesBeforeUser, newUserMessage];
        setMessages(updatedMessagesWithUser);
        setCurrentInput('');
        textareaRef.current?.focus();
        requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${(textareaRef.current as any).minHeight || '48px'}`; } });

        const isFirstUserMessageInChat = messagesBeforeUser.filter(m => m.speaker === 'user').length === 0;
        let finalTitleForSave = chatEntryForSend?.title;

        if (chatEntryForSend && chatEntryForSend.title === null && isFirstUserMessageInChat) {
            try {
                const aiGeneratedTitle = await generateTitleWithAI(userText);
                finalTitleForSave = aiGeneratedTitle;
                if (finalTitleForSave !== chatEntryForSend.title) {
                    setChatHistory(prevHistory => {
                        const newHistory = prevHistory.map(entry =>
                            entry.chatId === chatIdForAPI ? { ...entry, title: finalTitleForSave, lastUpdatedAt: Date.now() } : entry
                        );
                        newHistory.sort((a,b) => {
                            if(a.pinned && !b.pinned) return -1; if(!a.pinned && b.pinned) return 1; return b.lastUpdatedAt - a.lastUpdatedAt;
                        });
                        // No saveToStorage here, will be saved by saveMessagesToHistory or implicitly by fetchAndStreamResponse
                        return newHistory;
                    });
                }
            } catch (e) { console.error("Failed to generate title with AI during send.", e); }
        }

        saveMessagesToHistory(
            chatIdForAPI, updatedMessagesWithUser, modeBeforeSend,
            thinkingToggleStateBeforeSend, baseModel1_0BeforeSend, finalTitleForSave
        );

        const relevantMessagesForAPI = updatedMessagesWithUser
            .filter(m => (m.speaker === 'user' || (m.speaker === 'ai' && !m.isGenerating && !m.wasCancelled)) && m.fullText);
        const historyForAPI = relevantMessagesForAPI.slice(-MAX_HISTORY_MESSAGES_API)
            .map(m => ({ role: m.speaker === 'user' ? 'user' as const : 'assistant' as const, content: m.fullText! }));

        await fetchAndStreamResponse(
            newUserMessage, historyForAPI, newAiMessageId, 0,
            chatIdForAPI, modeBeforeSend, thinkingToggleStateBeforeSend, baseModel1_0BeforeSend,
            updatedMessagesWithUser // Pass the correctly updated list of messages
        );
    }, [
        currentInput, isGenerating, currentActiveChatId, messages, fetchAndStreamResponse,
        chatHistory, settings.defaultModel1_0, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn,
        generateTitleWithAI, saveMessagesToHistory, t
    ]);


    const handleRegenerate = useCallback(async (userPromptId: string) => {
        // ... (fungsi handleRegenerate tidak berubah signifikan)
        if (isGenerating || !currentActiveChatId) return;

        const chatIdForAPI = currentActiveChatId;
        const messagesSnapshot = messages;

        const userPromptMessage = messagesSnapshot.find(m => m.id === userPromptId && m.speaker === 'user');
        if (!userPromptMessage || typeof userPromptMessage.text !== 'string') { console.error("Prompt not found or invalid for regen:", userPromptId); return; }

        const relatedAiMessages = messagesSnapshot.filter(m => (m.speaker === 'ai' || m.speaker === 'error') && m.userPromptId === userPromptId);
        const nextGenerationIndex = relatedAiMessages.length;
        const newAiMessageId = uuidv4();

        const userPromptIndex = messagesSnapshot.findIndex(m => m.id === userPromptId);
        if (userPromptIndex === -1) { console.error("Prompt index not found for regen history:", userPromptId); return; }

        const relevantMessagesBeforePrompt = messagesSnapshot
             .slice(0, userPromptIndex)
             .filter(m => (m.speaker === 'user' || (m.speaker === 'ai' && !m.isGenerating && !m.wasCancelled)) && m.fullText);
        const historyForAPI = relevantMessagesBeforePrompt.slice(-MAX_HISTORY_MESSAGES_API + 1)
            .map(m => ({ role: m.speaker === 'user' ? 'user' as const : 'ai' as const, content: m.fullText! }));
         const finalHistoryForAPI = [...historyForAPI, { role: 'user' as const, content: userPromptMessage.text }];

        const modeBeforeRegen = currentChatAppVersionMode;
        const thinkingToggleStateBeforeRegen = currentChatIsThinkingModeToggleOn;
        const baseModel1_0BeforeRegen = chatHistory.find(c => c.chatId === currentActiveChatId)?.model1_0Base || settings.defaultModel1_0;

        await fetchAndStreamResponse(
            userPromptMessage, finalHistoryForAPI, newAiMessageId, nextGenerationIndex,
            chatIdForAPI, modeBeforeRegen, thinkingToggleStateBeforeRegen, baseModel1_0BeforeRegen,
            messagesSnapshot
        );
    }, [isGenerating, currentActiveChatId, messages, fetchAndStreamResponse, chatHistory, settings.defaultModel1_0, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn]);


    const handleCancelGeneration = useCallback(() => {
        // ... (fungsi handleCancelGeneration tidak berubah)
        if (abortController && isGenerating) {
            abortController.abort();
        }
    }, [abortController, isGenerating]);


     const handleNavigateResponse = useCallback((userPromptId: string, direction: 'prev' | 'next') => {
         // ... (fungsi handleNavigateResponse tidak berubah signifikan)
         if (!currentActiveChatId || isGenerating) return;
         const chatIdForSave = currentActiveChatId;
         let finalMessagesSnapshot: DisplayedChatMessage[] = [];

         setMessages(prevMsgs => {
             const relatedEntries = prevMsgs
                 .map((m, index) => ({ message: m, index }))
                 .filter(({ message }) => (message.speaker === 'ai' || message.speaker === 'error' || message.speaker === 'thinking') && message.userPromptId === userPromptId)
                 .sort((a, b) => (a.message.generationIndex ?? 0) - (b.message.generationIndex ?? 0) || (a.message.speaker === 'thinking' ? -1 : b.message.speaker === 'thinking' ? 1 : 0));
             const aiEntries = relatedEntries.filter(({ message }) => message.speaker === 'ai' || message.speaker === 'error');
             const totalGenerations = aiEntries.length;
             if (totalGenerations <= 1) return prevMsgs;

             const currentShownAiEntryIndex = aiEntries.findIndex(({ message }) => message.isCurrentGeneration);
             const currentIndex = currentShownAiEntryIndex !== -1 ? currentShownAiEntryIndex : totalGenerations - 1;
             let newIndexInRelated = currentIndex;
             if (direction === 'prev' && currentIndex > 0) newIndexInRelated = currentIndex - 1;
             else if (direction === 'next' && currentIndex < totalGenerations - 1) newIndexInRelated = currentIndex + 1;
             else return prevMsgs;

             const newCurrentGenerationIndex = aiEntries[newIndexInRelated].message.generationIndex;
             const updatedMessages = prevMsgs.map(msg => {
                  if ((msg.speaker === 'ai' || msg.speaker === 'error' || msg.speaker === 'thinking') && msg.userPromptId === userPromptId) {
                       const isNewCurrent = msg.generationIndex === newCurrentGenerationIndex;
                       return { ...msg, isCurrentGeneration: isNewCurrent };
                  }
                 return msg;
             });
             finalMessagesSnapshot = updatedMessages;
             const elementToScrollToId = updatedMessages.find(m => m.userPromptId === userPromptId && m.generationIndex === newCurrentGenerationIndex && (m.speaker === 'ai' || m.speaker === 'thinking'))?.id;
             if (elementToScrollToId) {
                  requestAnimationFrame(() => requestAnimationFrame(() => {
                       document.getElementById(`message-${elementToScrollToId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }));
             }
             return updatedMessages;
         });

          setTimeout(() => {
               if (chatIdForSave && finalMessagesSnapshot.length > 0) {
                   const currentChatEntry = chatHistory.find(c => c.chatId === chatIdForSave);
                    saveMessagesToHistory(chatIdForSave, finalMessagesSnapshot, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn, currentChatEntry?.model1_0Base || settings.defaultModel1_0);
               }
          }, 50);
     }, [currentActiveChatId, isGenerating, chatHistory, saveMessagesToHistory, currentChatAppVersionMode, currentChatIsThinkingModeToggleOn, settings.defaultModel1_0, messages]);


    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // ... (fungsi handleKeyDown tidak berubah)
        const shouldSend = settings.sendWithCtrlEnter
             ? (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
             : (event.key === 'Enter' && !event.shiftKey);
        if (shouldSend) {
             if (currentInput.trim() && !isGenerating && currentActiveChatId) {
                 event.preventDefault();
                 handleSendMessage();
             } else if (!currentInput.trim() && event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
             }
         }
    }, [handleSendMessage, isGenerating, currentInput, currentActiveChatId, settings.sendWithCtrlEnter]);


    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        // ... (fungsi handleInputChange tidak berubah)
        setCurrentInput(event.target.value);
        const target = event.target;
        target.style.height = 'auto';
        target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
    }, []);

    const handleSidebarSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         setSidebarSearchTerm(event.target.value);
    };

    const filteredChatList = useMemo(() => {
        const baseList = chatHistory.filter(chat =>
            settings.showArchivedChats ? true : !chat.archived
        );
        if (!sidebarSearchTerm) return baseList; // Already sorted by pinned/time
        const lowerCaseSearch = sidebarSearchTerm.toLowerCase();
        return baseList.filter(chat =>
            (chat.title && chat.title.toLowerCase().includes(lowerCaseSearch)) ||
            chat.messages.some(msg => typeof msg.text === 'string' && msg.text.toLowerCase().includes(lowerCaseSearch) && msg.speaker !== 'thinking')
        );
        // Sorting (pinned > time) is handled by save/load and updates to chatHistory
    }, [chatHistory, sidebarSearchTerm, settings.showArchivedChats]);

    const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
    const handleAccountClick = useCallback(() => {
        if (!isLoggedIn) {
            router.push('/auth');
        } else {
            // Mungkin buka modal profil pengguna atau navigasi ke halaman akun
            console.log("Account clicked, user is logged in. User profile:", userProfile);
        }
    }, [isLoggedIn, userProfile, router]);


    const handleLogout = useCallback(() => {
        signOut(auth).then(() => {
            // State isLoggedIn dan userProfile akan diupdate oleh onAuthStateChanged
            // Redirect ke halaman auth juga akan ditangani oleh onAuthStateChanged
            setChatHistory([]); 
            setCurrentActiveChatId(null);
            setMessages([]);
            console.log("User logged out");
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }, []);

    const handleAppVersionModeChange = useCallback((mode: AppVersionMode) => {
         // ... (fungsi handleAppVersionModeChange tidak berubah signifikan)
         if (!currentActiveChatId || isGenerating || isLoadingChat) return;
         setCurrentChatAppVersionMode(mode);
         if (mode === '1.0') {
             setCurrentChatIsThinkingModeToggleOn(settings.enableThinkingModeByDefault1_0);
         } else {
              setCurrentChatIsThinkingModeToggleOn(false);
         }
         const currentChatEntry = chatHistory.find(c => c.chatId === currentActiveChatId);
         if (currentChatEntry) {
              saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, chatHistory.map(c => c.chatId === currentActiveChatId ? { ...c, appVersionMode: mode, isThinkingModeToggleOn: mode === '1.0' ? settings.enableThinkingModeByDefault1_0 : false } : c), t, userProfile?.id);
         }
         setCurrentInput('');
    }, [currentActiveChatId, isGenerating, isLoadingChat, settings.enableThinkingModeByDefault1_0, chatHistory, t, userProfile?.id]);

    const handleThinkingModeToggle = useCallback(() => {
         // ... (fungsi handleThinkingModeToggle tidak berubah signifikan)
         if (currentChatAppVersionMode === '1.5' || !currentActiveChatId || isGenerating || isLoadingChat) return;
         const newState = !currentChatIsThinkingModeToggleOn;
         setCurrentChatIsThinkingModeToggleOn(newState);
         const currentChatEntry = chatHistory.find(c => c.chatId === currentActiveChatId);
         if (currentChatEntry) {
              saveChatHistoryToStorage(LOCALSTORAGE_HISTORY_KEY, chatHistory.map(c => c.chatId === currentActiveChatId ? { ...c, isThinkingModeToggleOn: newState } : c), t, userProfile?.id);
         }
    }, [currentChatAppVersionMode, currentChatIsThinkingModeToggleOn, currentActiveChatId, isGenerating, isLoadingChat, chatHistory, t, userProfile?.id]);


    useEffect(() => {
         // ... (useEffect untuk auto-scroll tidak berubah)
         if (!isLoadingChat && !isGenerating && messages.length > 0) {
             const lastMessage = messages[messages.length - 1];
             const shouldScroll = lastMessage && (!lastMessage.isStreaming || lastMessage.speaker === 'user');
             if (shouldScroll) {
                 const timer = setTimeout(() => {
                     chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                 }, AUTO_SCROLL_DELAY);
                 return () => clearTimeout(timer);
             }
         }
     }, [messages, isLoadingChat, isGenerating]);

     const startResizing = useCallback((e: React.MouseEvent) => { /* ... (tidak berubah) ... */
         if (isMobileView) return;
         e.preventDefault(); isResizingSidebar.current = true;
         document.addEventListener('mousemove', resizeSidebar); document.addEventListener('mouseup', stopResizing);
         document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
     }, [isMobileView]);
     const resizeSidebar = useCallback((e: MouseEvent) => { /* ... (tidak berubah) ... */
         if (!isResizingSidebar.current || !sidebarRef.current || isMobileView) return;
         const newWidth = e.clientX; const boundedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
         updateSettings('sidebarWidth', boundedWidth);
     }, [updateSettings, isMobileView]);
     const stopResizing = useCallback(() => { /* ... (tidak berubah) ... */
         if (!isResizingSidebar.current || isMobileView) return;
         isResizingSidebar.current = false;
         document.removeEventListener('mousemove', resizeSidebar); document.removeEventListener('mouseup', stopResizing);
         document.body.style.cursor = ''; document.body.style.userSelect = '';
     }, [resizeSidebar, isMobileView]);
     useEffect(() => { /* ... (tidak berubah) ... */
         return () => { if (isResizingSidebar.current) stopResizing(); };
     }, [stopResizing]);

    useEffect(() => {
        // ... (useEffect untuk initial prompt tidak berubah signifikan)
        if (isHistoryInitialized && isSettingsInitialized && !initialPromptProcessed) {
            const initialPromptText = localStorage.getItem('initialPrompt');
            if (initialPromptText) {
                localStorage.removeItem('initialPrompt');
                setInitialPromptProcessed(true);
                setTempInitialPrompt(initialPromptText);
                handleNewChat(false);
            } else if (!initialPromptProcessed) {
                setInitialPromptProcessed(true);
            }
        }
    }, [isHistoryInitialized, isSettingsInitialized, initialPromptProcessed, handleNewChat]);

    useEffect(() => {
        // ... (useEffect untuk send tempInitialPrompt tidak berubah signifikan)
        if (tempInitialPrompt && currentActiveChatId && messages.length === 1 && messages[0].speaker === 'ai' && !isGenerating) {
            const userMessageTimestamp = Date.now();
            const userPromptMessageId = uuidv4();
            const newUserMessage: DisplayedChatMessage = {
                id: userPromptMessageId, speaker: 'user', text: tempInitialPrompt,
                fullText: tempInitialPrompt, timestamp: userMessageTimestamp,
            };
            setMessages([messages[0], newUserMessage]);
            setCurrentInput('');
            const newAiMessageId = uuidv4();
            const apiHistoryForPrompt: ApiMessage[] = [{ role: 'user', content: tempInitialPrompt }];
            const chatEntry = chatHistory.find(c => c.chatId === currentActiveChatId);
            const modeForCall = chatEntry?.appVersionMode || settings.defaultAppVersionMode;
            const thinkingToggleForCall = chatEntry ? chatEntry.isThinkingModeToggleOn : (modeForCall === '1.0' ? settings.enableThinkingModeByDefault1_0 : false);
            const model1_0ForCall = chatEntry?.model1_0Base || settings.defaultModel1_0;

            fetchAndStreamResponse(
                newUserMessage, apiHistoryForPrompt, newAiMessageId, 0,
                currentActiveChatId, modeForCall, thinkingToggleForCall, model1_0ForCall, [messages[0], newUserMessage]
            ).then(() => { textareaRef.current?.focus(); })
             .catch(error => {
                console.error("Error auto-sending initial prompt:", error);
                setCurrentInput(tempInitialPrompt);
            });
            setTempInitialPrompt(null);
        }
    }, [tempInitialPrompt, currentActiveChatId, messages, isGenerating, fetchAndStreamResponse, chatHistory, settings, setMessages, setCurrentInput]);


    const stopButtonVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
        hidden: { opacity: 0, y: 10, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
    }), []);
    const suggestionChipVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
         initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, duration: 0.3 } }, exit: { opacity: 0, y: -10 }
    }), []);
    const suggestionChipItemVariants = useMemo(() => ({ /* ... (tidak berubah) ... */
         initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }
    }), []);

    const messagesToDisplay = useMemo(() => {
        // ... (logika messagesToDisplay tidak berubah)
        return messages.filter(message => {
             if (message.speaker === 'user' || message.speaker === 'error') return true;
             if (message.speaker === 'ai') return message.isCurrentGeneration;
             if (message.speaker === 'thinking') {
                  const correspondingAiMsg = messages.find(aiMsg =>
                       (aiMsg.speaker === 'ai' || aiMsg.speaker === 'error') &&
                       aiMsg.userPromptId === message.userPromptId &&
                       aiMsg.generationIndex === message.generationIndex
                  );
                  return correspondingAiMsg?.isCurrentGeneration === true;
             }
             return false;
        });
    }, [messages]);

    // Close chat item menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeChatMenu) {
                const menuElement = document.getElementById(`chat-menu-${activeChatMenu}`);
                const triggerElement = chatMenuItemRefs.current[activeChatMenu];
                if (menuElement && !menuElement.contains(event.target as Node) &&
                    triggerElement && !triggerElement.contains(event.target as Node)) {
                    setActiveChatMenu(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeChatMenu]);


    if (!isAuthInitialized || !isSettingsInitialized || !isHistoryInitialized || (isAuthInitialized && !isLoggedIn && !userProfile)) {
         return (
             <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                 <FiLoader className="animate-spin w-12 h-12 text-blue-500" />
             </div>
         );
    }

    // --- Render ---
    return (
         <SettingsContext.Provider value={settingsContextValue}>
             <div className={`flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased font-sans ${settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                <style jsx global>{`
                    :root { --sidebar-width: ${settings.sidebarWidth}px; }
                    /* ... (CSS tidak berubah) ... */
                    .katex-display > .katex { text-align: left !important; } .katex-display-wrapper { margin: 1.25em 0; } .katex-display { overflow-x: auto; overflow-y: hidden; padding-bottom: 0.2em; }
                    .prose :where(code):not(:where([class~="not-prose"] *))::before, .prose :where(code):not(:where([class~="not-prose"] *))::after { content: none; } .prose :where(blockquote p:first-of-type):not(:where([class~="not-prose"] *))::before { content: none; } .prose :where(blockquote p:last-of-type):not(:where([class~="not-prose"] *))::after { content: none; }
                    .markdown-content > :first-child { margin-top: 0 !important; } .markdown-content > :last-child { margin-bottom: 0 !important; } .prose .not-prose { color: inherit; font-size: inherit; line-height: inherit; }
                    .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #d1d5db #f3f4f6; } .dark .scrollbar-thin { scrollbar-color: #4b5563 #1f2937; }
                    .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; } .scrollbar-thin::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 3px;} .dark .scrollbar-thin::-webkit-scrollbar-track { background: #1f2937; } .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 3px; border: 1px solid #f3f4f6; } .dark .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border: 1px solid #1f2937; } .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #a3aab4; } .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #5c6a7e; }
                    *:focus-visible { outline: 2px solid ${settings.theme === 'dark' ? '#60a5fa' : '#2563eb'}; outline-offset: 1px; border-radius: 2px; }
                    .sidebar-resize-handle { position: absolute; top: 0; right: -4px; bottom: 0; width: 8px; cursor: col-resize; z-index: 50; }
                    .sidebar-resize-handle:hover::after, .sidebar-resize-handle:active::after { content: ''; position: absolute; top: 0; left: 3px; bottom: 0; width: 2px; background: ${settings.theme === 'dark' ? '#3b82f6' : '#1d4ed8'}; opacity: 0.5; }
                 `}</style>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={settings}
                    onSettingsChange={updateSettings}
                    isLoggedIn={isLoggedIn}
                    t={t}
                    onDeleteAllChats={handleDeleteAllChats} // Pass new prop
                />
                <ConfirmationModal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)} t={t} {...confirmationProps} />

                <AnimatePresence>
                    {isMobileView && isSidebarOpen && (
                        <motion.div
                            key="mobile-sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-sm md:hidden"
                            onClick={toggleSidebar}
                        />
                    )}
                </AnimatePresence>

                 <motion.aside /* ... (Sidebar, dengan sedikit perubahan untuk menu chat item) ... */
                    ref={sidebarRef} initial={false}
                    animate={ isMobileView ? { x: isSidebarOpen ? 0 : '-100%' } : { width: isSidebarOpen ? settings.sidebarWidth : 0, opacity: isSidebarOpen ? 1 : 0, x: 0 } }
                    transition={{ type: "spring", stiffness: 400, damping: 40, duration: 0.3 }}
                    className={` ${isMobileView ? 'fixed top-0 left-0 h-full z-50 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl' : 'relative z-30 h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0'} flex flex-col overflow-hidden `}
                    style={ isMobileView ? { width: 'min(300px, 85vw)' } : { } }
                 >
                    {(isSidebarOpen || !isMobileView) && (
                        <>
                             <div className="p-3 flex items-center justify-between flex-shrink-0 border-b border-gray-200 dark:border-gray-700 h-16">
                                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors overflow-hidden" title={APP_TITLE}>
                                     <FiCpu className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"/>
                                     <span className="truncate">{APP_TITLE}</span>
                                </Link>
                                 <Tooltip text={t('collapseSidebar')} position={isMobileView ? "bottom" : "right"} delay={500}>
                                     <motion.button onClick={toggleSidebar} className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500" whileTap={{scale: 0.9}} aria-label={t('collapseSidebar')}>
                                         {isMobileView ? <FiX size={18} /> : <FiChevronLeft size={18} />}
                                    </motion.button>
                                 </Tooltip>
                             </div>
                            <div className="p-3 space-y-3 flex-shrink-0">
                                <motion.button onClick={() => handleNewChat()} disabled={isLoadingChat || isGenerating} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-white dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed`} whileHover={!isLoadingChat && !isGenerating ? {scale: 1.02} : {}} whileTap={!isLoadingChat && !isGenerating ? {scale: 0.98} : {}} title={t('newChat')}>
                                    {isLoadingChat ? <FiLoader className="animate-spin w-4 h-4"/> : <FiPlus size={16}/>}
                                    <span>{isLoadingChat ? t('loadingChat') : t('newChat')}</span>
                                </motion.button>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    <input type="text" placeholder={t('searchChats')} value={sidebarSearchTerm} onChange={handleSidebarSearchChange} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"/>
                                </div>
                            </div>
                             <div className="px-5 pt-3 pb-1 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('chatHistory')}</h3>
                                <Tooltip text={settings.showArchivedChats ? t('hideArchived') : t('showArchived')} position="left" delay={300}>
                                    <button
                                        onClick={() => updateSettings('showArchivedChats', !settings.showArchivedChats)}
                                        className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                    >
                                        {settings.showArchivedChats ? <FiEyeOffIcon size={14} /> : <FiEyeIcon size={14} />}
                                    </button>
                                </Tooltip>
                             </div>

                            <nav className="flex-grow overflow-y-auto px-2 py-2 scrollbar-thin">
                                {filteredChatList.filter(c => !c.archived).length > 0 && (
                                    <motion.ul layout className="space-y-1">
                                        <AnimatePresence initial={false}>
                                            {filteredChatList.filter(c => !c.archived).map((chatEntry) => (
                                                <motion.li key={chatEntry.chatId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                                // MODIFIKASI className di sini:
                                                className={`relative group ${activeChatMenu === chatEntry.chatId ? 'z-10' : 'z-auto'}`}
                                            >
                                                    <button
                                                        onClick={() => loadChat(chatEntry.chatId)}
                                                        disabled={isLoadingChat || isGenerating}
                                                        className={`w-full flex items-center justify-between gap-2 pl-3 pr-8 py-2.5 text-sm rounded-md text-left transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                                                            currentActiveChatId === chatEntry.chatId
                                                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 font-medium shadow-inner'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60'
                                                        }`}
                                                    >
                                                        {chatEntry.pinned && <FiStar className="w-3 h-3 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mr-1.5" />}
                                                        <div className="flex-grow overflow-hidden">
                                                            <span className="block truncate text-xs font-medium">
                                                                {chatEntry.title || t('untitledChat')}
                                                            </span>
                                                            <span className={`block text-[10px] mt-0.5 truncate ${currentActiveChatId === chatEntry.chatId ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                {formatTimestampRelative(chatEntry.lastUpdatedAt, settings.language)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                    {/* Chat Item Menu Button */}
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                         <Tooltip text={t('chatActions')} position="top" delay={500}>
                                                            <motion.button
                                                                ref={el => { chatMenuItemRefs.current[chatEntry.chatId] = el; }}
                                                                onClick={(e) => { e.stopPropagation(); setActiveChatMenu(activeChatMenu === chatEntry.chatId ? null : chatEntry.chatId); }}
                                                                whileTap={{ scale: 0.9 }}
                                                                disabled={isLoadingChat || isGenerating}
                                                            >
                                                                <FiMoreVertical size={16} />
                                                            </motion.button>
                                                         </Tooltip>
                                                         {/* Chat Item Dropdown Menu */}
                                                         <AnimatePresence>
                                                            {activeChatMenu === chatEntry.chatId && (
                                                                <motion.div
                                                                    id={`chat-menu-${chatEntry.chatId}`}
                                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -5, transition: {duration: 0.1} }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}
                                                                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 origin-top-right z-20"
                                                                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
                                                                >
                                                                    <button onClick={() => handleTogglePinChat(chatEntry.chatId)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                                        {chatEntry.pinned ? <FiStar className="w-3.5 h-3.5 text-yellow-500 fill-current" /> : <FiStar className="w-3.5 h-3.5" />}
                                                                        {chatEntry.pinned ? t('unpinChat') : t('pinChat')}
                                                                    </button>
                                                                    <button onClick={() => handleToggleArchiveChat(chatEntry.chatId)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                                        <FiArchiveIcon className="w-3.5 h-3.5" />
                                                                        {t('archiveChat')}
                                                                    </button>
                                                                    <button onClick={() => confirmDeleteChat(chatEntry.chatId, chatEntry.title)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                                                        <FiTrash className="w-3.5 h-3.5" />
                                                                        {t('deleteAction')}
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                         </AnimatePresence>
                                                    </div>
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </motion.ul>
                                )}

                                {/* Archived Chats Section */}
                                {settings.showArchivedChats && filteredChatList.filter(c => c.archived).length > 0 && (
                                    <>
                                        <div className="px-3 pt-4 pb-1 flex items-center">
                                            <FiArchiveIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mr-2" />
                                            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('archivedSectionTitle')}</h4>
                                        </div>
                                        <motion.ul layout className="space-y-1 mt-1">
                                            <AnimatePresence initial={false}>
                                                {filteredChatList.filter(c => c.archived).map((chatEntry) => (
                                                    <motion.li key={chatEntry.chatId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="relative group opacity-70 hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => loadChat(chatEntry.chatId)}
                                                            disabled={isLoadingChat || isGenerating}
                                                            className={`relative group opacity-70 hover:opacity-100 transition-opacity ${activeChatMenu === chatEntry.chatId ? 'z-10' : 'z-auto'}`} // Tingkatkan z-index li yang akti
                                                        >
                                                            {chatEntry.pinned && <FiStar className="w-3 h-3 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mr-1.5" />}
                                                            <div className="flex-grow overflow-hidden">
                                                                <span className="block truncate text-xs font-medium">
                                                                    {chatEntry.title || t('untitledChat')}
                                                                </span>
                                                                <span className={`block text-[10px] mt-0.5 truncate ${currentActiveChatId === chatEntry.chatId ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                    {formatTimestampRelative(chatEntry.lastUpdatedAt, settings.language)}
                                                                </span>
                                                            </div>
                                                        </button>
                                                        
                                                         {/* Menu for Archived Chat */}
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                             <Tooltip text={t('chatActions')} position="top" delay={500}>
                                                                <motion.button
                                                                    ref={el => { chatMenuItemRefs.current[chatEntry.chatId] = el; }}
                                                                    onClick={(e) => { e.stopPropagation(); setActiveChatMenu(activeChatMenu === chatEntry.chatId ? null : chatEntry.chatId); }}
                                                                    className={`p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-blue-500 ${activeChatMenu === chatEntry.chatId ? 'opacity-100 bg-gray-200 dark:bg-gray-700/80' : ''}`}
                                                                    whileTap={{ scale: 0.9 }} disabled={isLoadingChat || isGenerating}
                                                                > <FiMoreVertical size={16} /> </motion.button>
                                                             </Tooltip>
                                                             <AnimatePresence>
                                                                {activeChatMenu === chatEntry.chatId && (
                                                                    <motion.div
                                                                        id={`chat-menu-${chatEntry.chatId}`} initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5, transition:{duration:0.1}}} transition={{ type: 'spring', stiffness: 500, damping: 30, duration:0.15 }}
                                                                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 py-1 origin-top-right" onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button onClick={() => handleToggleArchiveChat(chatEntry.chatId)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                                            <FiArchiveIcon className="w-3.5 h-3.5" /> {t('unarchiveChat')}
                                                                        </button>
                                                                        <button onClick={() => confirmDeleteChat(chatEntry.chatId, chatEntry.title)} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                                                            <FiTrash className="w-3.5 h-3.5" /> {t('deleteAction')}
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                             </AnimatePresence>
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </AnimatePresence>
                                        </motion.ul>
                                    </>
                                )}

                                {filteredChatList.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-70">
                                        <FiArchive className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"/>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {sidebarSearchTerm ? `${t('noHistory')} "${sidebarSearchTerm}"` : t('noHistory')}
                                        </span>
                                         {settings.showArchivedChats && chatHistory.filter(c => c.archived).length > 0 && !sidebarSearchTerm && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('noArchivedChats')}</span>
                                        )}
                                    </div>
                                )}
                            </nav>

                             <div className="p-3 border-t border-gray-200 dark:border-gray-700 mt-auto flex-shrink-0">
                                 <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer" onClick={handleAccountClick}>
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isLoggedIn ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                                            {isLoggedIn && userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt="User Avatar" className="w-full h-full rounded-full object-cover" /> : <FiUser size={18}/>}
                                         </div>
                                         <div className="overflow-hidden text-sm">
                                             <p className="font-medium truncate text-gray-800 dark:text-gray-100">{isLoggedIn ? (userProfile?.name || 'User') : t('account')}</p>
                                             <p className="text-xs truncate text-gray-500 dark:text-gray-400">{isLoggedIn ? (userProfile?.email || 'demo@example.com') : t('login') + ' / ' + t('signUp')}</p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-1 flex-shrink-0">
                                          <Tooltip text={t('settings')} position="top" delay={500}>
                                             <button onClick={(e) => {e.stopPropagation(); setIsSettingsOpen(true);}} className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500" aria-label={t('settings')}>
                                                 <FiSettings size={16}/>
                                             </button>
                                          </Tooltip>
                                          {isLoggedIn && (
                                              <Tooltip text={t('logout')} position="top" delay={500}>
                                                 <button onClick={(e) => {e.stopPropagation(); handleLogout();}} className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500" aria-label={t('logout')}>
                                                     <FiLogOut size={16}/>
                                                 </button>
                                              </Tooltip>
                                          )}
                                     </div>
                                 </div>
                             </div>
                         </>
                     )}
                      {!isMobileView && isSidebarOpen && <div className="sidebar-resize-handle" onMouseDown={startResizing}></div>}
                 </motion.aside>

                 <motion.main /* ... (Main content area, tidak banyak berubah) ... */
                    className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-900/95 transition-colors duration-300"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 40, duration: 0.3 }}
                 >
                     <div className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-gray-200 dark:border-gray-700/80 flex-shrink-0 bg-white dark:bg-gray-800/60 backdrop-blur-sm relative z-10">
                          <div className="flex items-center gap-3">
                            {(isMobileView || !isSidebarOpen) && (
                                <Tooltip text={isSidebarOpen && isMobileView ? t('collapseSidebar') : t('expandSidebar')} position="right" delay={300}>
                                    <motion.button onClick={toggleSidebar} className="p-2 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500" whileTap={{scale: 0.9}} aria-label={isSidebarOpen && isMobileView ? t('collapseSidebar') : t('expandSidebar')}>
                                        {isMobileView ? (isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />) : <FiChevronRight size={20} /> }
                                    </motion.button>
                                </Tooltip>
                            )}
                              <div className={`flex items-center gap-2 ${(isMobileView && isSidebarOpen) ? 'hidden' : ''}`}>
                                   <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">{t('appVersionModeLabel')}:</span>
                                    <div className="relative">
                                         <select value={currentChatAppVersionMode} onChange={(e) => handleAppVersionModeChange(e.target.value as AppVersionMode)} className="pl-3 pr-8 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed" disabled={isGenerating || isLoadingChat}>
                                              <option value="1.0">{t('chatNPT1_0')}</option>
                                              <option value="1.5">{t('chatNPT1_5')}</option>
                                         </select>
                                         <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"/>
                                    </div>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <Tooltip text={settings.theme === 'dark' ? t('light') : t('dark')} position="bottom" delay={500}>
                                <button onClick={() => updateSettings('theme', settings.theme === 'dark' ? 'light' : (settings.theme === 'light' ? 'system' : 'dark'))} className="p-2 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500">
                                    {settings.theme === 'dark' ? <FiSun size={18}/> : (settings.theme === 'light' ? <FiMoon size={18}/> : <FiSliders size={18} />) }
                                </button>
                             </Tooltip>
                          </div>
                     </div>

                     <div className={`flex-grow overflow-y-auto scrollbar-thin relative ${settings.interfaceDensity === 'compact' ? 'p-3 md:p-4' : settings.interfaceDensity === 'comfortable' ? 'p-4 md:p-6' : 'p-6 md:p-8'}`}>
                          <AnimatePresence initial={false}>
                             {messagesToDisplay.map((message) => (
                                    <ChatBubble
                                        key={`${message.id}-${message.generationIndex}`} // Ensure key is unique even for multiple generations of same prompt
                                        message={message}
                                        isStreamingEnabled={settings.isStreamingEnabled}
                                        density={settings.interfaceDensity}
                                        showTimestamp={settings.showTimestamp}
                                        fontSize={settings.fontSize}
                                        t={t}
                                        language={settings.language}
                                        onRegenerate={(message.speaker === 'ai' || message.speaker === 'error') && message.userPromptId && !isGenerating ? handleRegenerate : undefined}
                                        onNavigate={(message.speaker === 'ai' || message.speaker === 'error') && message.userPromptId && (message.totalGenerations ?? 0) > 1 && !isGenerating ? handleNavigateResponse : undefined}
                                        isThinkingModeActive={isThinkingModeActiveForCurrentChat}
                                    />
                             ))}
                          </AnimatePresence>
                          <AnimatePresence>
                            {isLoadingChat && (
                                <motion.div key="chat-loading-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                                     <FiLoader className="animate-spin w-8 h-8 text-blue-500"/>
                                </motion.div>
                            )}
                          </AnimatePresence>
                          <div ref={chatEndRef} style={{ height: '1px' }} aria-hidden="true" />
                     </div>

                    <div className={`px-4 md:px-6 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/70 flex-shrink-0 shadow-[0_-4px_15px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_15px_-8px_rgba(0,0,0,0.3)] relative z-10`}>
                         <AnimatePresence>
                             {settings.autoSuggestEnabled && messages.length === 1 && messages[0].speaker === 'ai' && !currentInput && !isGenerating && (
                                 <motion.div key="suggestion-chips" variants={suggestionChipVariants} initial="initial" animate="animate" exit="exit" className="flex flex-wrap justify-center gap-2 mb-3.5 max-w-4xl mx-auto">
                                     {suggestionChipsData.map(chip => (
                                         <Tooltip key={chip.id} text={chip.prompt ? `${t(chip.labelKey)}: "${chip.prompt}"` : t(chip.labelKey)} position="top" delay={500} disabled={chip.disabled}>
                                              <motion.button variants={suggestionChipItemVariants} onClick={() => chip.prompt ? setCurrentInput(chip.prompt) : chip.action?.()} disabled={chip.disabled || isGenerating || isLoadingChat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700/60 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600/80 hover:bg-gray-100 dark:hover:bg-gray-600/80 hover:border-gray-300 dark:hover:border-gray-500 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`} whileHover={chip.disabled || isGenerating || isLoadingChat ? undefined : {y: -2}} whileTap={chip.disabled || isGenerating || isLoadingChat ? undefined : {scale: 0.95}} aria-label={chip.prompt ? t(chip.labelKey) : t(chip.labelKey)}>
                                                   <chip.icon className="w-3.5 h-3.5"/>
                                                   <span>{t(chip.labelKey)}</span>
                                              </motion.button>
                                         </Tooltip>
                                     ))}
                                 </motion.div>
                             )}
                         </AnimatePresence>
                         <div className="flex justify-center items-center h-8 mb-2">
                             <AnimatePresence>
                                 {isGenerating && (
                                     <motion.button key="stop-button" variants={stopButtonVariants} initial="hidden" animate="visible" exit="hidden" onClick={handleCancelGeneration} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700/70 text-red-600 dark:text-red-300 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={t('stopGenerating')}>
                                         <FiSquare className="w-3 h-3 fill-current"/> {t('stopGenerating')}
                                     </motion.button>
                                 )}
                             </AnimatePresence>
                         </div>
                         <div className="relative flex items-end max-w-4xl mx-auto bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600/80 rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                            <Tooltip text={t('attachFile')} position="top" delay={500} disabled={true}>
                                 <button className="p-3 text-gray-400 dark:text-gray-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={true} aria-label={t('attachFile')}>
                                     <FiPaperclip size={18}/>
                                 </button>
                             </Tooltip>
                              <Tooltip
                                text={currentChatAppVersionMode === '1.5' ? t('thinkingModeAlwaysOn', { version: t('chatNPT1_5') }) : (currentChatIsThinkingModeToggleOn ? t('thinkingModeTooltip') : t('standardModeTooltip'))}
                                position="top" delay={500} disabled={currentChatAppVersionMode === '1.5'}>
                                 <button onClick={handleThinkingModeToggle} disabled={currentChatAppVersionMode === '1.5' || isGenerating || isLoadingChat} className={`p-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${isThinkingModeActiveForCurrentChat ? 'text-purple-600 dark:text-purple-400' : ''}`} aria-pressed={isThinkingModeActiveForCurrentChat} aria-label={currentChatAppVersionMode === '1.5' ? t('thinkingMode') + ' (' + t('thinkingModeAlwaysOn', { version: t('chatNPT1_5') }) + ')' : t('thinkingMode')}>
                                     {isThinkingModeActiveForCurrentChat && currentChatAppVersionMode === '1.5' ? <FiInfoCircle size={18} className="text-blue-500"/> : <FiZap size={18}/>}
                                 </button>
                              </Tooltip>
                               <Tooltip text={`${t('searchWeb')} (${t('comingSoon')})`} position="top" delay={500} disabled={true}>
                                 <button className="p-3 text-gray-400 dark:text-gray-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md cursor-not-allowed opacity-60" disabled={true} aria-label={t('searchWeb')}>
                                     <FiSearch size={18}/>
                                 </button>
                               </Tooltip>
                                <Tooltip text={`${t('mcp')} (${t('comingSoon')})`} position="top" delay={500} disabled={true}>
                                 <button className="p-3 text-gray-400 dark:text-gray-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md cursor-not-allowed opacity-60" disabled={true} aria-label={t('mcp')}>
                                     <FiBriefcase size={18}/>
                                 </button>
                                </Tooltip>
                             <textarea ref={textareaRef} value={currentInput} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={t('sendMessagePlaceholder')} rows={1} className={`flex-grow resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition duration-200 max-h-40 scrollbar-thin py-3 px-2 ${settings.interfaceDensity === 'compact' ? 'text-sm leading-tight' : 'text-base leading-normal'} disabled:opacity-70 disabled:cursor-not-allowed`} disabled={isGenerating || isLoadingChat} aria-label={t('sendMessagePlaceholder')} style={{ minHeight: '48px' }} />
                              <Tooltip text={`${t('recordAudio')} (${t('comingSoon')})`} position="top" delay={500} disabled={true}>
                                 <button className="p-3 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={true} aria-label={t('recordAudio')}>
                                     <FiMic size={18}/>
                                 </button>
                              </Tooltip>
                             <Tooltip text={t('submitPrompt')} position="top" delay={500} disabled={!currentInput.trim() || isGenerating || isLoadingChat}>
                                 <motion.button onClick={handleSendMessage} disabled={!currentInput.trim() || isGenerating || isLoadingChat} className={`p-3 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${ currentInput.trim() && !isGenerating && !isLoadingChat ? 'text-blue-600 dark:text-blue-400' : '' }`} whileHover={!currentInput.trim() || isGenerating || isLoadingChat ? undefined : { scale: 1.1 }} whileTap={!currentInput.trim() || isGenerating || isLoadingChat ? undefined : { scale: 0.9 }} aria-label={isGenerating ? "Generating response" : t('submitPrompt')}>
                                     <AnimatePresence mode="popLayout" initial={false}>
                                         <motion.div key={isGenerating ? 'loader' : 'send'} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}>
                                             {isGenerating ? <FiLoader className="animate-spin w-5 h-5"/> : <FiSend className="w-5 h-5 transform rotate-45"/>}
                                         </motion.div>
                                     </AnimatePresence>
                                 </motion.button>
                             </Tooltip>
                         </div>
                         <div className="text-center mt-2.5">
                             <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                 {APP_TITLE} v{APP_VERSION} by {APP_AUTHOR}. AI responses may be inaccurate.
                             </p>
                         </div>
                    </div>
                 </motion.main>
             </div>
         </SettingsContext.Provider>
     );
}