// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import ThinkingBubble from './ThinkingBubble';
import WelcomeScreen from './WelcomeScreen';
import { Message, ThinkingStep } from '@/hooks/useChatLogic';
import { FiCpu } from 'react-icons/fi'; // Untuk indikator loading

interface ChatAreaProps {
  messages: Message[];
  thinkingSteps: ThinkingStep[];
  isLoading: boolean; // Ini adalah isLoading global dari useChatLogic
  currentModelAlias: string;
  isDarkMode: boolean;
  onPromptSuggestionClick: (prompt: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  thinkingSteps,
  isLoading, // isLoading global
  currentModelAlias,
  isDarkMode,
  onPromptSuggestionClick,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      // Sedikit timeout untuk memberi waktu render sebelum scroll
      setTimeout(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, thinkingSteps, isLoading]); // isLoading ditambahkan agar scroll saat loading dimulai

  const hasMessagesOrThinking = messages.length > 0 || (currentModelAlias === "ChatNPT 1.0 Think" && thinkingSteps.length > 0);
  const showGlobalLoadingIndicator = isLoading && (!messages.length || messages[messages.length - 1]?.speaker === 'user');


  return (
    <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-1 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]">
      <AnimatePresence initial={false}>
        {!hasMessagesOrThinking && !isLoading && ( // Hanya tampilkan welcome screen jika benar-benar kosong & tidak loading
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeScreen onPromptSuggestionClick={onPromptSuggestionClick} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isDarkMode={isDarkMode}
            isLastMessage={index === messages.length - 1}
            // isStreamingAi adalah true jika ini pesan AI terakhir DAN isLoading global true
            isStreamingAi={isLoading && msg.speaker === 'ai' && index === messages.length - 1}
          />
        ))}
      </AnimatePresence>

      {currentModelAlias === "ChatNPT 1.0 Think" && thinkingSteps.length > 0 && (
         <ThinkingBubble steps={thinkingSteps} />
      )}

      {/* Indikator loading global (tiga titik) jika AI sedang memproses dan belum ada bubble AI */}
      <AnimatePresence>
        {showGlobalLoadingIndicator && (
          <motion.div
            key="global-loading-indicator"
            layout // Menambahkan layout agar animasi lebih mulus saat muncul/hilang
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 my-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0">
              <FiCpu className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div className="flex space-x-1.5 p-3 bg-[var(--card-bg)] rounded-xl shadow border border-[var(--border-color)]">
              <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
              <motion.div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-1"/> {/* Spacer untuk memastikan scroll */}
    </div>
  );
};

export default React.memo(ChatArea);