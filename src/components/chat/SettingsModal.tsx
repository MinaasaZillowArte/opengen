import React, { useState, useEffect } from 'react';
import { FiX, FiSun, FiMoon, FiTrash2, FiSettings, FiSave, FiGift, FiMail, FiLink, FiLoader, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession } from '@/types/chat';
import { Message } from '@/hooks/useChatLogic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  onClearAllChats: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null;
  chatMessages: Message[];
}

type ActiveTab = 'general' | 'data' | 'beta';

const SwitchToggle: React.FC<{ enabled: boolean; setEnabled: (enabled: boolean) => void; labelId: string; }> = ({ enabled, setEnabled, labelId }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-labelledby={labelId}
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] focus:ring-offset-[var(--card-bg)]`}
      style={{ backgroundColor: enabled ? 'var(--color-primary)' : 'var(--bg-tertiary)' }}
    >
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  onClearAllChats,
  chatSessions,
  currentChatId
}) => {
  const [enterToSend, setEnterToSend] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('data');
  const [shareHistory, setShareHistory] = useState(true);
  const [useTools, setUseTools] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const savedShareHistory = localStorage.getItem('opengen_share_history');
    if (savedShareHistory !== null) {
      setShareHistory(JSON.parse(savedShareHistory));
    }
  }, []);

  const handleShareHistoryChange = (enabled: boolean) => {
    setShareHistory(enabled);
    localStorage.setItem('opengen_share_history', JSON.stringify(enabled));
  };

  const handleShareLink = async () => {
    if (!currentChatId) {
        alert("Please select a chat to share.");
        return;
    }

    const currentSession = chatSessions.find(s => s.id === currentChatId);
    if (!currentSession) {
        alert("Could not find the current chat session data.");
        return;
    }

    setShareStatus('loading');
    try {
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentSession),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to create share link.');
        }

        const link = `${window.location.origin}/shared/${data.shareId}`;
        await navigator.clipboard.writeText(link);
        setShareStatus('success');

    } catch (err: any) {
        console.error("Failed to copy link:", err);
        setShareStatus('error');
    } finally {
        setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  const handleClearChatsAction = () => {
    onClearAllChats();
    setShowDeleteModal(false);
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const TabButton: React.FC<{ tabId: ActiveTab; currentTab: ActiveTab; onClick: () => void; children: React.ReactNode; Icon: React.ElementType }> =
    ({ tabId, currentTab, onClick, children, Icon }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 w-full text-left
                  ${currentTab === tabId
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
    >
      <Icon className="w-4 h-4 mr-2.5"/>
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="settings-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={onClose}
          >
            <motion.div
              key="settings-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-[var(--card-bg)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-[var(--border-color)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
                <button onClick={onClose} className="p-1.5 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                <nav className="w-full md:w-1/3 lg:w-1/4 p-4 border-b md:border-b-0 md:border-r border-[var(--border-color)] space-y-1.5 flex-shrink-0">
                  <TabButton tabId="general" currentTab={activeTab} onClick={() => setActiveTab('general')} Icon={FiSettings}>General</TabButton>
                  <TabButton tabId="data" currentTab={activeTab} onClick={() => setActiveTab('data')} Icon={FiSave}>Data Controls</TabButton>
                  <TabButton tabId="beta" currentTab={activeTab} onClick={() => setActiveTab('beta')} Icon={FiGift}>Beta Features</TabButton>
                </nav>

                <div className="flex-grow p-6 overflow-y-auto scrollbar-thin">
                  {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Theme</label>
                      <button onClick={onThemeChange} className="flex items-center justify-center w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                        {theme === 'light' ? <FiMoon className="w-4 h-4 mr-2" /> : <FiSun className="w-4 h-4 mr-2" />}
                        Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                      </button>
                    </div>
                     <div>
                        <label htmlFor="enterToSend" className="flex items-center text-sm font-medium text-[var(--text-secondary)]">
                            <input type="checkbox" id="enterToSend" checked={enterToSend} onChange={() => setEnterToSend(!enterToSend)} className="mr-2 h-4 w-4 rounded text-[var(--color-primary)] border-[var(--border-color)] focus:ring-[var(--color-primary)]"/>
                            Send message on Enter (Shift+Enter for new line)
                        </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Feedback</label>
                      <a 
                        href="mailto:faldloudnd@gmail.com?subject=Feedback for OpenGen/ChatNPT&body=Hi OpenGen Team,%0A%0AI have some feedback regarding the ChatNPT application:%0A%0A"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center px-4 py-2.5 border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <FiMail className="w-4 h-4 mr-2"/> Send Feedback via Email
                      </a>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Have a suggestion or found a bug? We'd love to hear from you!</p>
                    </div>
                  </div>
                )}
                  {activeTab === 'data' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                          <label id="share-history-label" className="block text-sm font-medium text-[var(--text-primary)]">Share chat history to OpenGen</label>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-sm">This helps us improve our models by allowing us to use your anonymized conversations.</p>
                        </div>
                        <div className="flex-shrink-0">
                           <SwitchToggle enabled={shareHistory} setEnabled={handleShareHistoryChange} labelId="share-history-label" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex-grow">
                          <label className="block text-sm font-medium text-[var(--text-primary)]">Share chat</label>
                           <p className="text-xs text-[var(--text-tertiary)] mt-1">Create a shareable, read-only link for the current conversation.</p>
                        </div>
                         <button onClick={handleShareLink} disabled={shareStatus === 'loading'} className="flex items-center justify-center px-4 py-2 border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex-shrink-0 min-w-[130px]">
                            {shareStatus === 'loading' && <FiLoader className="w-4 h-4 animate-spin"/>}
                            {shareStatus === 'idle' && <><FiLink className="w-4 h-4 mr-2"/>Create Link</>}
                            {shareStatus === 'success' && <><FiCheck className="w-4 h-4 mr-2 text-green-500"/>Copied!</>}
                            {shareStatus === 'error' && <><FiAlertTriangle className="w-4 h-4 mr-2 text-red-500"/>Error</>}
                        </button>
                      </div>
                      <div className="border-t border-[var(--border-color)] pt-6 mt-6">
                        <label className="block text-sm font-medium text-[var(--text-primary)]">Danger Zone</label>
                         <p className="text-xs text-[var(--text-tertiary)] mt-1 mb-3">This action is permanent and cannot be undone.</p>
                        <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center justify-center px-4 py-2.5 border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md text-sm font-medium transition-colors">
                            <FiTrash2 className="w-4 h-4 mr-2"/> Delete All Chat Data
                        </button>
                      </div>
                    </div>
                  )}
                   {activeTab === 'beta' && (
                    <div className="space-y-6">
                       <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                          <label id="use-tools-label" className="block text-sm font-medium text-[var(--text-primary)]">Use tools</label>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-sm">Allow ChatNPT to use experimental tools like search engines to enhance responses.</p>
                        </div>
                        <div className="flex-shrink-0">
                          <SwitchToggle enabled={useTools} setEnabled={setUseTools} labelId='use-tools-label' />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                key="delete-modal-backdrop"
                variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[110]"
                onClick={() => setShowDeleteModal(false)}
              >
                <motion.div
                  key="delete-modal-content"
                  variants={modalVariants}
                  className="bg-[var(--card-bg)] p-6 rounded-lg shadow-xl w-full max-w-md text-[var(--text-primary)] border border-[var(--border-color)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/30 sm:mx-0 sm:h-10 sm:w-10">
                       <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                       <h3 className="text-lg leading-6 font-medium text-[var(--text-primary)]">Delete all chats</h3>
                       <div className="mt-2">
                          <p className="text-sm text-[var(--text-secondary)]">
                            Are you sure you want to delete all chat history? This action cannot be undone.
                          </p>
                       </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm"
                        onClick={handleClearChatsAction}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border-color)] shadow-sm px-4 py-2 bg-[var(--button-bg)] text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SettingsModal);