// src/components/chat/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import {
  FiPlusSquare,
  FiMessageSquare,
  FiArchive,
  FiInbox,
  FiTrash2,
  FiX,
  FiEdit3,
  FiCheck,
  FiChevronDown,
  FiFolder,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession } from '@/types/chat';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onArchiveChat: (sessionId: string, isArchived: boolean) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
}

export default function Sidebar({
  isOpen,
  toggleSidebar,
  chatSessions,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onArchiveChat,
  onRenameChat,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditText(session.title);
  };

  const handleConfirmEdit = () => {
    if (editingId && editText.trim()) {
      onRenameChat(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const activeSessions = chatSessions.filter(s => !s.isArchived);
  const archivedSessions = chatSessions.filter(s => s.isArchived);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30, duration: 0.3 },
    },
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const renderSessionItem = (session: ChatSession, isArchivedList: boolean) => (
    <motion.li
      key={session.id}
      variants={itemVariants}
      layout
      className={`group/item relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors duration-150
                  ${
                    currentChatId === session.id && !editingId
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                  ${editingId === session.id ? 'bg-[var(--bg-tertiary)]' : ''}`}
      onClick={() => !editingId && onSelectChat(session.id)}
    >
      {editingId === session.id ? (
        <div className="flex-grow flex items-center gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
            onBlur={handleCancelEdit} // Or handleConfirmEdit on blur
            autoFocus
            className="flex-grow p-1 bg-transparent border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            style={{
                backgroundColor: 'var(--card-bg)', // Explicitly set background for input
                color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); handleConfirmEdit(); }}
            title="Save title"
            className="p-1.5 text-[var(--color-success)] hover:opacity-80"
          >
            <FiCheck size={16} />
          </button>
        </div>
      ) : (
        <>
          <FiMessageSquare
            size={16}
            className={`mr-2.5 flex-shrink-0 ${
              currentChatId === session.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-tertiary)] group-hover/item:text-[var(--text-primary)]'
            }`}
          />
          <span className="flex-grow text-sm truncate" title={session.title}>
            {session.title}
          </span>
          <div className="flex-shrink-0 flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 focus-within:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
              title="Edit title"
              className="p-1.5 hover:text-[var(--color-primary)] rounded-md"
            >
              <FiEdit3 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onArchiveChat(session.id, !session.isArchived); }}
              title={isArchivedList ? 'Unarchive Chat' : 'Archive Chat'}
              className="p-1.5 hover:text-[var(--color-primary)] rounded-md"
            >
              {isArchivedList ? <FiInbox size={14} /> : <FiArchive size={14} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
              title="Delete Chat"
              className="p-1.5 hover:text-[var(--color-error)] rounded-md"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </>
      )}
    </motion.li>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 md:hidden z-20"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        className="fixed top-0 left-0 h-full w-[280px] sm:w-[300px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] shadow-lg flex flex-col z-30"
        style={{ transform: isOpen ? 'translateX(0%)' : 'translateX(-100%)' }} // Ensure transform is applied
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Chat History</h2>
          <button
            onClick={toggleSidebar}
            title="Close sidebar"
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] md:hidden" // Hidden on larger screens where header toggle is used
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2.5 p-3 mb-3 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-opacity-90 transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            <FiPlusSquare size={18} /> New Chat
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto p-3 pt-0 space-y-1 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]">
          <AnimatePresence>
            {activeSessions.map(session => renderSessionItem(session, false))}
          </AnimatePresence>
        </nav>

        <div className="p-3 border-t border-[var(--border-color)]">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <FiFolder size={16} /> Archived Chats
            </span>
            <FiChevronDown
              size={18}
              className={`transition-transform duration-200 ${showArchived ? 'transform rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="mt-2 pl-2 border-l-2 border-[var(--border-color-translucent)] overflow-hidden"
              >
                {archivedSessions.length > 0 ? (
                   <ul className="space-y-1 py-1">
                    {archivedSessions.map(session => renderSessionItem(session, true))}
                   </ul>
                ) : (
                  <p className="p-2 text-xs text-center text-[var(--text-tertiary)]">No archived chats.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}