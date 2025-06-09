'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatPageHeader, {
  CHAT_PAGE_HEADER_HEIGHT_MOBILE,
  CHAT_PAGE_HEADER_HEIGHT_DESKTOP
} from '@/components/chat/ChatPageHeader';
import ChatArea from '@/components/chat/ChatArea';
import InputArea from '@/components/chat/InputArea';
import SettingsModal from '@/components/chat/SettingsModal';
import Sidebar from '@/components/chat/Sidebar';
import { useChatLogic, Message, UseChatLogicReturn } from '@/hooks/useChatLogic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession } from '@/types/chat';

const defaultTheme = 'light';

const generateUID = () => {
  let uid = Date.now().toString(36);
  while (uid.length < 80) {
    uid += Math.random().toString(36).substring(2);
  }
  return uid.substring(0, 80);
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15, ease: "easeIn" } },
};

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentActiveChatId, setCurrentActiveChatId] = useState<string | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);

  const {
    messages,
    thinkingSteps,
    isLoading,
    error,
    currentModelAlias,
    sendMessage: sendLogicMessage,
    setCurrentModelAlias: setLogicModelAlias,
    clearChat: clearLogicChat,
    stopGeneration,
    setMessages: setLogicMessages,
    handleLike,
    handleDislike,
    handleNavigateVersion,
    handleRegenerate,
    handleEditSubmit,
  }: UseChatLogicReturn = useChatLogic();

  const initialLoadProcessedRef = useRef(false);
  const previousChatIdRef = useRef<string | null>(null);

  const saveCurrentChatStateToSessions = useCallback((chatIdToSave: string | null, currentMessages: Message[], currentModel: string) => {
    if (chatIdToSave) {
        setChatSessions(prevSessions => {
            const sessionIndex = prevSessions.findIndex(s => s.id === chatIdToSave);
            if (sessionIndex !== -1) {
                const updatedSessionData = {
                    ...prevSessions[sessionIndex],
                    messages: currentMessages,
                    modelAliasUsed: currentModel,
                    timestamp: Date.now(),
                };
                if (JSON.stringify(prevSessions[sessionIndex]) !== JSON.stringify(updatedSessionData)) {
                    const updatedSessions = [...prevSessions];
                    updatedSessions[sessionIndex] = updatedSessionData;
                    return updatedSessions;
                }
            } else {
                const newSessionFromState: ChatSession = {
                    id: chatIdToSave,
                    title: currentMessages.find(m=>m.speaker==='user')?.text.substring(0,30) || `Chat ${new Date().toLocaleTimeString()}`,
                    messages: currentMessages,
                    timestamp: Date.now(),
                    modelAliasUsed: currentModel,
                };
                if (!prevSessions.find(s => s.id === chatIdToSave)) {
                    return [newSessionFromState, ...prevSessions];
                }
            }
            return prevSessions;
        });
    }
  }, []);

  const handleSendMessage = useCallback(async (prompt: string) => {
    let targetChatId = currentActiveChatId;
    let userMessageAlreadyAddedToLogic = false;

    if (!targetChatId) {
      const newChatId = generateUID();
      const firstUserMessage: Message = {
        id: generateUID(),
        text: prompt,
        speaker: 'user',
        timestamp: Date.now(),
      };
      const newSession: ChatSession = {
        id: newChatId,
        title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
        messages: [firstUserMessage],
        timestamp: Date.now(),
        modelAliasUsed: currentModelAlias,
      };
      
      setChatSessions(prev => [newSession, ...prev.filter(s => s.id !== newChatId)]);
      setCurrentActiveChatId(newChatId);
      
      clearLogicChat();
      setLogicMessages([firstUserMessage]);
      
      targetChatId = newChatId;
      userMessageAlreadyAddedToLogic = true;
      
      localStorage.setItem('pending_prompt_for_new_chat', JSON.stringify({
          chatId: newChatId, 
          prompt: prompt, 
          modelAlias: currentModelAlias
      }));
      router.push(`/chatllm?chatId=${newChatId}`, { scroll: false });
    } else {
      const sessionToUpdate = chatSessions.find(s => s.id === targetChatId);
      if (sessionToUpdate && sessionToUpdate.messages.length === 0 && 
          (sessionToUpdate.title.startsWith("Chat ") || sessionToUpdate.title.startsWith("New Chat"))) {
           setChatSessions(prev => prev.map(s => s.id === targetChatId ? {...s, title: prompt.substring(0,30) + (prompt.length > 30 ? '...' : '')} : s));
       }
    }
    
    await sendLogicMessage(prompt, userMessageAlreadyAddedToLogic);

  }, [currentActiveChatId, currentModelAlias, chatSessions, sendLogicMessage, setLogicMessages, router, clearLogicChat]);

  const applyThemeVariables = useCallback((selectedTheme: string) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const vars = selectedTheme === 'dark' ? { '--bg-primary': '#0f172a', '--bg-secondary': '#1e293b', '--bg-tertiary': '#334155', '--card-bg': '#1e293b', '--accent-bg-light': 'rgba(59, 130, 246, 0.15)', '--text-primary': '#f1f5f9', '--text-secondary': '#cbd5e1', '--text-tertiary': '#94a3b8', '--border-color': '#334155', '--border-color-hover': '#475569', '--button-bg': '#334155', '--button-hover-bg': '#475569', '--color-primary': '#60a5fa', '--color-secondary': '#a78bfa', '--color-success': '#34d399', '--color-error': '#f43f5e', '--scrollbar-thumb': '#475569', '--scrollbar-track': '#1e293b', '--inline-code-bg': 'rgba(51, 65, 85, 0.5)', '--inline-code-text': '#e2e8f0', '--overlay-bg': 'rgba(15, 23, 42, 0.8)' }
                                    : { '--bg-primary': '#ffffff', '--bg-secondary': '#f8fafc', '--bg-tertiary': '#f1f5f9', '--card-bg': '#ffffff', '--accent-bg-light': '#e0f2fe', '--text-primary': '#0f172a', '--text-secondary': '#475569', '--text-tertiary': '#64748b', '--border-color': '#e2e8f0', '--border-color-hover': '#cbd5e1', '--button-bg': '#ffffff', '--button-hover-bg': '#f1f5f9', '--color-primary': '#3b82f6', '--color-secondary': '#8b5cf6', '--color-success': '#10b981', '--color-error': '#ef4444', '--scrollbar-thumb': '#cbd5e1', '--scrollbar-track': '#f8fafc', '--inline-code-bg': 'rgba(226, 232, 240, 0.5)', '--inline-code-text': '#0f172a', '--overlay-bg': 'rgba(248, 250, 252, 0.8)' };
    Object.entries(vars).forEach(([key, value]) => { root.style.setProperty(key, value); });
    if (selectedTheme === 'dark') { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, []);

  useEffect(() => {
    setIsClient(true);
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : defaultTheme);
    setTheme(initialTheme); applyThemeVariables(initialTheme);
    if (window.innerWidth >= 768) {
        const storedSidebarState = localStorage.getItem('sidebarOpen');
        setIsSidebarOpen(storedSidebarState ? storedSidebarState === 'true' : true);
    }
  }, [applyThemeVariables]);

  const handleThemeChange = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme); applyThemeVariables(newTheme); return newTheme;
    });
  }, [applyThemeVariables]);

  useEffect(() => {
    if (isClient) {
      const storedSessions = localStorage.getItem('chatNPT_sessions');
      if (storedSessions) { setChatSessions(JSON.parse(storedSessions)); }
      initialLoadProcessedRef.current = true;
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && initialLoadProcessedRef.current) {
      if (chatSessions.length > 0) { localStorage.setItem('chatNPT_sessions', JSON.stringify(chatSessions)); } 
      else { localStorage.removeItem('chatNPT_sessions'); }
    }
  }, [chatSessions, isClient]);

  useEffect(() => {
    if (!isClient || !initialLoadProcessedRef.current) return;

    const queryChatId = searchParams.get('chatId');

    if (previousChatIdRef.current && previousChatIdRef.current !== queryChatId) {
        const prevSession = chatSessions.find(s => s.id === previousChatIdRef.current);
        if (prevSession) {
            saveCurrentChatStateToSessions(previousChatIdRef.current, messages, currentModelAlias);
        }
    }
    
    if (queryChatId) {
        if (queryChatId !== currentActiveChatId) {
            const existingSession = chatSessions.find(session => session.id === queryChatId);
            if (existingSession) {
                clearLogicChat();
                setLogicMessages(existingSession.messages);
                setLogicModelAlias(existingSession.modelAliasUsed || "ChatNPT 1.0");
                setCurrentActiveChatId(queryChatId);

                const pendingPromptData = localStorage.getItem('pending_prompt_for_new_chat');
                if (pendingPromptData) {
                    const { chatId: pendingChatId, prompt: pendingPrompt, modelAlias: pendingModelAlias } = JSON.parse(pendingPromptData);
                    if (pendingChatId === queryChatId && 
                        existingSession.messages.length === 1 && 
                        existingSession.messages[0].speaker === 'user' &&
                        existingSession.messages[0].text === pendingPrompt
                        ) {
                        localStorage.removeItem('pending_prompt_for_new_chat');
                        if(pendingModelAlias && pendingModelAlias !== currentModelAlias) {
                            setLogicModelAlias(pendingModelAlias);
                        }
                        sendLogicMessage(pendingPrompt, true); 
                    } else if (pendingChatId === queryChatId) {
                        localStorage.removeItem('pending_prompt_for_new_chat');
                    }
                }
            } else {
                console.warn(`Session with ID ${queryChatId} not found. Starting new chat mode.`);
                router.replace('/chatllm');
            }
        }
    } else { 
        if (currentActiveChatId !== null) {
            clearLogicChat();
            setCurrentActiveChatId(null);
        } else if (messages.length > 0 && !isLoading) { 
            clearLogicChat();
        }
    }
    previousChatIdRef.current = queryChatId;

  }, [searchParams, isClient, chatSessions, router, clearLogicChat, setLogicMessages, setLogicModelAlias, currentActiveChatId, messages, isLoading, currentModelAlias, saveCurrentChatStateToSessions, sendLogicMessage]);

  useEffect(() => {
    if (isClient && currentActiveChatId && messages.length > 0) {
      const activeSessionInArray = chatSessions.find(s => s.id === currentActiveChatId);
      if (activeSessionInArray) {
        if (JSON.stringify(activeSessionInArray.messages) !== JSON.stringify(messages)) {
            saveCurrentChatStateToSessions(currentActiveChatId, messages, currentModelAlias);
        }
      } else if (messages.length > 0) {
        saveCurrentChatStateToSessions(currentActiveChatId, messages, currentModelAlias);
      }
    }
  }, [messages, currentActiveChatId, isClient, saveCurrentChatStateToSessions, currentModelAlias, chatSessions]);

  const handleModelChange = (newAlias: string) => {
    if (newAlias !== currentModelAlias) {
      setLogicModelAlias(newAlias);
      if (currentActiveChatId) {
        setChatSessions(prev =>
          prev.map(s =>
            s.id === currentActiveChatId ? { ...s, modelAliasUsed: newAlias, timestamp: Date.now() } : s
          )
        );
      }
    }
  };

  const handleNewChat = useCallback(() => {
    if (currentActiveChatId) {
      saveCurrentChatStateToSessions(currentActiveChatId, messages, currentModelAlias);
    }
    router.push('/chatllm', { scroll: false });
    if (window.innerWidth < 768 && isClient) setIsSidebarOpen(false);
  }, [currentActiveChatId, messages, currentModelAlias, saveCurrentChatStateToSessions, router, isClient]);

  const handleSelectChat = useCallback((sessionId: string) => {
    if (sessionId === currentActiveChatId) {
      if (window.innerWidth < 768 && isClient) setIsSidebarOpen(false);
      return;
    }
    if (currentActiveChatId) {
        saveCurrentChatStateToSessions(currentActiveChatId, messages, currentModelAlias);
    }
    router.push(`/chatllm?chatId=${sessionId}`, { scroll: false });
    if (window.innerWidth < 768 && isClient) setIsSidebarOpen(false);
  }, [currentActiveChatId, messages, currentModelAlias, saveCurrentChatStateToSessions, router, isClient]);

  const handleDeleteChat = useCallback((sessionId: string) => {
    const sessionToDelete = chatSessions.find(s => s.id === sessionId);
    if (sessionToDelete) {
      setChatToDelete(sessionToDelete);
      setIsDeleteConfirmModalOpen(true);
    } else {
      console.warn(`Session with ID ${sessionId} not found for deletion.`);
    }
  }, [chatSessions]);

  const confirmDeleteChat = useCallback(() => {
    if (chatToDelete) {
      const deletedChatId = chatToDelete.id;
      
      setChatSessions(prev => prev.filter(s => s.id !== deletedChatId));

      if (deletedChatId === currentActiveChatId) {
        clearLogicChat(); 
        setCurrentActiveChatId(null); 
        router.push('/chatllm', { scroll: false });
      }

      setIsDeleteConfirmModalOpen(false);
      setChatToDelete(null);
    }
  }, [chatToDelete, currentActiveChatId, router, clearLogicChat]);
  
  const cancelDeleteChat = useCallback(() => {
    setIsDeleteConfirmModalOpen(false);
    setChatToDelete(null);
  }, []);
  
  const handleArchiveChat = useCallback((sessionId: string, isArchived: boolean) => {
    setChatSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, isArchived, timestamp: Date.now() } : s))
    );
    if (sessionId === currentActiveChatId && isArchived) {
        handleNewChat();
    }
  }, [currentActiveChatId, handleNewChat]);

  const handleRenameChat = useCallback((sessionId: string, newTitle: string) => {
    setChatSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: newTitle, timestamp: Date.now() } : s))
    );
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
        const newState = !prev;
        if (isClient && window.innerWidth >= 768) {
            localStorage.setItem('sidebarOpen', newState.toString());
        }
        return newState;
    });
  }, [isClient]);

  const clearAllLocalChats = useCallback(() => {
    setChatSessions([]);
    router.push('/chatllm', { scroll: false });
  }, [router]);

  const mainContentPaddingTop = isClient
    ? (window.innerWidth < 768 ? `${CHAT_PAGE_HEADER_HEIGHT_MOBILE}px` : `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`)
    : `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`;

  const mainContentStyle: React.CSSProperties = {};
  if (isClient && window.innerWidth >= 768) {
    mainContentStyle.marginLeft = isSidebarOpen ? '300px' : '0px';
    mainContentStyle.width = isSidebarOpen ? 'calc(100% - 300px)' : '100%';
    mainContentStyle.transition = 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out';
  }

  if (!isClient) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">Loading ChatNPT...</div>;
  }

  return (
    <ErrorBoundary>
      <div className={`theme-${theme} flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden`}>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          chatSessions={chatSessions}
          currentChatId={currentActiveChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onArchiveChat={handleArchiveChat}
          onRenameChat={handleRenameChat}
        />
        <div className="flex flex-col flex-grow w-full" style={mainContentStyle}>
          <ChatPageHeader
            currentModelAlias={currentModelAlias}
            onModelChange={handleModelChange}
            isLoading={isLoading}
            theme={theme}
            onThemeChange={handleThemeChange}
            onSettingsClick={() => setIsSettingsModalOpen(true)}
            onToggleSidebar={toggleSidebar}
          />
          <main
            className="flex-grow flex flex-col overflow-hidden"
            style={{ paddingTop: mainContentPaddingTop }}
          >
            <div className="flex flex-col flex-grow w-full overflow-hidden">
              <ChatArea
                messages={messages}
                thinkingSteps={thinkingSteps}
                isLoading={isLoading && (!messages.length || (messages.length > 0 && messages[messages.length - 1]?.speaker === 'user'))}
                currentModelAlias={currentModelAlias}
                isDarkMode={theme === 'dark'}
                onPromptSuggestionClick={handleSendMessage}
                onRegenerate={handleRegenerate}
                onLike={handleLike}
                onDislike={handleDislike}
                onNavigateVersion={handleNavigateVersion}
                onEditSubmit={handleEditSubmit}
              />
              {error && (
                <div className="px-4 py-2 text-center text-red-500 bg-red-500/10 text-xs">
                  Error: {error}
                </div>
              )}
              <InputArea
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onStopGeneration={stopGeneration}
              />
            </div>
          </main>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        chatMessages={messages}
        onClearAllChats={clearAllLocalChats}
        chatSessions={chatSessions}
        currentChatId={currentActiveChatId}
      />
      {isDeleteConfirmModalOpen && chatToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4">
          <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-xl w-full max-w-md text-[var(--text-primary)] border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete the chat session titled "<strong>{chatToDelete.title}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteChat}
                className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--button-bg)] hover:bg-[var(--button-hover-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default function ChatLLMPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">Loading Chat Interface...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}