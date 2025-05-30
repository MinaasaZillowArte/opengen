// src/app/chatllm/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatPageHeader, { 
  CHAT_PAGE_HEADER_HEIGHT_MOBILE, 
  CHAT_PAGE_HEADER_HEIGHT_DESKTOP 
} from '@/components/chat/ChatPageHeader';
import ChatArea from '@/components/chat/ChatArea';
import InputArea from '@/components/chat/InputArea';
import SettingsModal from '@/components/chat/SettingsModal';
import { useChatLogic, Message } from '@/hooks/useChatLogic'; // Pastikan Message diekspor dari hook
import ErrorBoundary from '@/components/ErrorBoundary';


const defaultTheme = 'light';

export default function ChatLLMPage() {
  console.log("ChatLLMPage rendering..."); // LOG AWAL

  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const {
    messages,
    thinkingSteps,
    isLoading,
    error,
    currentModelAlias,
    sendMessage,
    setCurrentModelAlias,
    clearChat,
    stopGeneration,
  } = useChatLogic();

  // applyThemeVariables di-memoize dengan useCallback dan dependensi kosong
  const applyThemeVariables = useCallback((selectedTheme: string) => {
    if (typeof window === 'undefined') return;
    console.log("Applying theme:", selectedTheme);
    const root = document.documentElement;
    // ... (isi fungsi applyThemeVariables SAMA SEPERTI SEBELUMNYA, pastikan tidak ada dependensi eksternal yang berubah)
    const vars = selectedTheme === 'dark' ? { '--bg-primary': '#0f172a', '--bg-secondary': '#1e293b', '--bg-tertiary': '#334155', '--card-bg': '#1e293b', '--accent-bg-light': 'rgba(59, 130, 246, 0.15)', '--text-primary': '#f1f5f9', '--text-secondary': '#cbd5e1', '--text-tertiary': '#94a3b8', '--border-color': '#334155', '--border-color-hover': '#475569', '--button-bg': '#334155', '--button-hover-bg': '#475569', '--color-primary': '#60a5fa', '--color-secondary': '#a78bfa', '--scrollbar-thumb': '#475569', '--scrollbar-track': '#1e293b', '--inline-code-bg': 'rgba(51, 65, 85, 0.5)', '--inline-code-text': '#e2e8f0', '--overlay-bg': 'rgba(15, 23, 42, 0.8)' }
                                    : { '--bg-primary': '#ffffff', '--bg-secondary': '#f8fafc', '--bg-tertiary': '#f1f5f9', '--card-bg': '#ffffff', '--accent-bg-light': '#e0f2fe', '--text-primary': '#0f172a', '--text-secondary': '#475569', '--text-tertiary': '#64748b', '--border-color': '#e2e8f0', '--border-color-hover': '#cbd5e1', '--button-bg': '#ffffff', '--button-hover-bg': '#f1f5f9', '--color-primary': '#3b82f6', '--color-secondary': '#8b5cf6', '--scrollbar-thumb': '#cbd5e1', '--scrollbar-track': '#f8fafc', '--inline-code-bg': 'rgba(226, 232, 240, 0.5)', '--inline-code-text': '#0f172a', '--overlay-bg': 'rgba(248, 250, 252, 0.8)' };
    Object.entries(vars).forEach(([key, value]) => { root.style.setProperty(key, value); });
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Efek untuk setIsClient (hanya sekali saat mount)
  useEffect(() => {
    console.log("Setting isClient to true");
    setIsClient(true);
  }, []); 

  // Efek untuk tema, bergantung pada isClient dan applyThemeVariables yang sudah stabil
  useEffect(() => {
    if (isClient) {
      console.log("isClient is true, applying initial theme logic");
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
      setTheme(initialTheme); // Ini akan memicu re-render
      applyThemeVariables(initialTheme); // Ini seharusnya tidak memicu re-run useEffect ini jika applyThemeVariables stabil
    }
  }, [isClient, applyThemeVariables]); // Hanya bergantung pada isClient dan applyThemeVariables yang stabil
  
  // ... (sisa fungsi handleThemeChange, handleModelChange, handlePromptSuggestionClick tetap sama)
  const handleThemeChange = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyThemeVariables(newTheme); // applyThemeVariables dari scope luar
      return newTheme;
    });
  }, [applyThemeVariables]); // Tambahkan applyThemeVariables sebagai dependensi

  const handleModelChange = (newAlias: string) => {
    if (newAlias !== currentModelAlias) {
        setCurrentModelAlias(newAlias);
    }
  };

  const handlePromptSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };


  const mainContentPaddingTop = isClient 
    ? (window.innerWidth < 768 ? `${CHAT_PAGE_HEADER_HEIGHT_MOBILE}px` : `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`)
    : `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`;

  console.log("Before !isClient check, isClient:", isClient);
  if (!isClient) {
    console.log("Rendering fallback UI because !isClient");
    return (
        <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
            <div 
              style={{ height: `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`, borderBottom: '1px solid var(--border-color)' }} 
              className="bg-[var(--bg-primary)] fixed top-0 left-0 right-0 z-40 w-full"
            />
            <div 
              className="flex-grow flex items-center justify-center text-[var(--text-secondary)]"
              style={{ paddingTop: `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px`}}
            >
              Loading ChatNPT...
            </div>
        </div>
    );
  }

  console.log("Rendering main UI because isClient is true");
  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center h-screen text-red-500 p-4 bg-[var(--bg-primary)]">
        <h2 className="text-xl font-semibold">Oops! Something went wrong.</h2>
        <p className="text-[var(--text-secondary)] mt-2">Please try refreshing the page.</p>
      </div>
    }>
      <div className={`theme-${theme} flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300`}>
        <ChatPageHeader
          currentModelAlias={currentModelAlias}
          onModelChange={handleModelChange}
          isLoading={isLoading}
          theme={theme}
          onThemeChange={handleThemeChange}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
        />
        <main 
          className="flex-grow flex flex-col overflow-hidden"
          style={{ paddingTop: mainContentPaddingTop }}
        >
          <div className="flex flex-col flex-grow w-full overflow-hidden">
            <ChatArea
              messages={messages}
              thinkingSteps={thinkingSteps}
              isLoading={isLoading && (!messages.length || messages[messages.length - 1]?.speaker === 'user')}
              currentModelAlias={currentModelAlias}
              isDarkMode={theme === 'dark'}
              onPromptSuggestionClick={handlePromptSuggestionClick}
            />
            {error && (
              <div className="px-4 py-2 text-center text-red-500 bg-red-500/10 text-xs">
                Error from useChatLogic: {error}
              </div>
            )}
            <InputArea
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onStopGeneration={stopGeneration}
            />
          </div>
        </main>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        chatMessages={messages}
        onClearAllChats={clearChat}
      />
    </ErrorBoundary>
  );
}