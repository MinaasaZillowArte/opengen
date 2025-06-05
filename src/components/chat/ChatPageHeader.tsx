// src/components/chat/ChatPageHeader.tsx
'use client';

import React from 'react';
import { FiSettings, FiSun, FiMoon, FiCpu, FiMenu } from 'react-icons/fi';
import ModelSelector from './ModelSelector';

interface ChatPageHeaderProps {
  currentModelAlias: string;
  onModelChange: (alias: string) => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  onSettingsClick: () => void;
  onToggleSidebar: () => void;
}

export const CHAT_PAGE_HEADER_HEIGHT_MOBILE = 60;
export const CHAT_PAGE_HEADER_HEIGHT_DESKTOP = 65;

const ChatPageHeader: React.FC<ChatPageHeaderProps> = ({
  currentModelAlias,
  onModelChange,
  isLoading,
  theme,
  onThemeChange,
  onSettingsClick,
  onToggleSidebar,
}) => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-color)]"
      style={{ height: `${CHAT_PAGE_HEADER_HEIGHT_MOBILE}px` }}
    >
      <div
        className="flex items-center justify-between h-full px-3 md:px-4"
        style={{ '--chat-header-height-desktop': `${CHAT_PAGE_HEADER_HEIGHT_DESKTOP}px` } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle Button - visible on all screens for consistency, or md:hidden if sidebar is always open on desktop */}
          <button
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FiMenu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
           <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <span className="font-semibold text-lg hidden sm:inline">ChatNPT</span>
          </div>
        </div>

        <div className="flex-grow flex justify-center">
          <ModelSelector
            currentModelAlias={currentModelAlias}
            onModelChange={onModelChange}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onThemeChange}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
          </button>
          <button
            onClick={onSettingsClick}
            title="Settings"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FiSettings className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style jsx>{`
        @media (min-width: 768px) {
          header {
            height: var(--chat-header-height-desktop);
          }
        }
      `}</style>
    </header>
  );
};

export default React.memo(ChatPageHeader);