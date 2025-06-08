// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import ThinkingBubble from './ThinkingBubble';
import WelcomeScreen from './WelcomeScreen';
import { Message, ThinkingStep } from '@/hooks/useChatLogic';
import { FiCpu, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiChevronLeft, FiChevronRight, FiCopy, FiCheck } from 'react-icons/fi';

interface ChatAreaProps {
  messages: Message[];
  thinkingSteps: ThinkingStep[];
  isLoading: boolean;
  currentModelAlias: string;
  isDarkMode: boolean;
  onPromptSuggestionClick: (prompt: string) => void;
  onRegenerate: (messageId: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onNavigateVersion: (messageId: string, direction: 'prev' | 'next') => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  thinkingSteps,
  isLoading,
  currentModelAlias,
  isDarkMode,
  onPromptSuggestionClick,
  onRegenerate,
  onLike,
  onDislike,
  onNavigateVersion,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = useCallback((textToCopy: string, messageId: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => console.error("Failed to copy:", err));
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, thinkingSteps, isLoading]);

  const hasMessagesOrThinking = messages.length > 0 || (currentModelAlias === "ChatNPT 1.0 Think" && thinkingSteps.length > 0);
  const showGlobalLoadingIndicator = isLoading && (!messages.length || messages[messages.length - 1]?.speaker === 'user');

  return (
    <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-1 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]">
      <AnimatePresence initial={false}>
        {!hasMessagesOrThinking && !isLoading && (
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
        {messages.map((msg, index) => {
           const isLastMessage = index === messages.length - 1;
           const isStreaming = isLoading && msg.speaker === 'ai' && isLastMessage;
           const showActions = msg.speaker === 'ai' && !isStreaming && !msg.error;

          return (
            <div key={msg.id} className="group/message-container relative">
              <MessageBubble
                message={msg}
                isDarkMode={isDarkMode}
                isLastMessage={isLastMessage}
                isStreamingAi={isStreaming}
              />

              {showActions && (
                <div className="pt-1 pl-10">
                    <motion.div
                        className="relative flex items-center gap-1.5 opacity-0 group-hover/message-container:opacity-100 transition-opacity duration-200 h-8"
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                    >
                        {/* Version Navigation */}
                        {msg.versions && msg.versions.length > 1 && (
                            <div className="flex items-center gap-0.5 p-1 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-color)]">
                                <button onClick={() => onNavigateVersion(msg.id, 'prev')} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed" disabled={msg.activeVersion === 0} title="Previous version"><FiChevronLeft size={14} /></button>
                                <span className="text-xs font-mono text-[var(--text-tertiary)] px-1">{msg.activeVersion! + 1}/{msg.versions.length}</span>
                                <button onClick={() => onNavigateVersion(msg.id, 'next')} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed" disabled={msg.activeVersion === msg.versions.length - 1} title="Next version"><FiChevronRight size={14} /></button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-0.5 p-1 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-color)]">
                            <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-colors" title={copiedMessageId === msg.id ? "Copied!" : "Copy"}>
                                {copiedMessageId === msg.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
                            </button>
                             <button onClick={() => onLike(msg.id)} className={`p-1.5 rounded-md transition-colors ${msg.feedback === 'liked' ? 'text-[var(--color-success)]' : 'text-[var(--text-tertiary)] hover:text-[var(--color-success)]'}`} title="Like response"><FiThumbsUp size={14} /></button>
                             <button onClick={() => onDislike(msg.id)} className={`p-1.5 rounded-md transition-colors ${msg.feedback === 'disliked' ? 'text-[var(--color-error)]' : 'text-[var(--text-tertiary)] hover:text-[var(--color-error)]'}`} title="Dislike response"><FiThumbsDown size={14} /></button>
                             <button onClick={() => onRegenerate(msg.id)} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-colors" title="Regenerate response"><FiRefreshCw size={14} /></button>
                        </div>

                    </motion.div>
                </div>
              )}
            </div>
        )})}
      </AnimatePresence>

      {currentModelAlias === "ChatNPT 1.0 Think" && thinkingSteps.length > 0 && (
         <ThinkingBubble steps={thinkingSteps} />
      )}

      <AnimatePresence>
        {showGlobalLoadingIndicator && (
          <motion.div
            key="global-loading-indicator"
            layout
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
      <div className="h-1"/>
    </div>
  );
};

export default React.memo(ChatArea);