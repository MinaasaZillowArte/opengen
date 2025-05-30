import React, { useState, useEffect } from 'react';
import { FiX, FiSun, FiMoon, FiType, FiMaximize, FiMinimize, FiShare2, FiDownload, FiTrash2, FiInfo, FiSettings, FiSave, FiGift } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/hooks/useChatLogic'; // For export data type

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  chatMessages: Message[]; // Pass chat messages for export
  onClearAllChats: () => void; // Callback to clear chats
  // Add other settings props as needed:
  // fontSize, onFontSizeChange
  // messageDensity, onMessageDensityChange
  // enterToSend, onEnterToSendChange
}

type ActiveTab = 'general' | 'data' | 'beta';

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  chatMessages,
  onClearAllChats
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  // Placeholder states for settings
  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large'
  const [messageDensity, setMessageDensity] = useState('comfortable'); // 'compact', 'comfortable'
  const [enterToSend, setEnterToSend] = useState(true);
  const [shareLinkEnabled, setShareLinkEnabled] = useState(false);
  const [shareDataForTraining, setShareDataForTraining] = useState(false);

  if (!isOpen) return null;

  const handleExportData = (format: 'json' | 'md') => {
    let dataStr = "";
    let filename = "";
    if (format === 'json') {
      dataStr = JSON.stringify(chatMessages, null, 2);
      filename = 'chatnpt_export.json';
    } else {
      dataStr = chatMessages.map(msg => `**${msg.speaker === 'user' ? 'You' : 'ChatNPT'}** (${new Date(msg.timestamp || 0).toLocaleString()}):\n\n${msg.text}\n\n---\n`).join('');
      filename = 'chatnpt_export.md';
    }
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleClearChatsWithConfirmation = () => {
    if (window.confirm("Are you sure you want to delete all chat messages? This action cannot be undone.")) {
        onClearAllChats();
        // Potentially close modal or give feedback
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeIn" } },
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
        <motion.div
          key="settings-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            key="settings-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[var(--card-bg)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()} // Prevent close on modal content click
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
              <button onClick={onClose} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
              {/* Sidebar for Tabs */}
              <nav className="w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r border-[var(--border-color)] space-y-1.5">
                <TabButton tabId="general" currentTab={activeTab} onClick={() => setActiveTab('general')} Icon={FiSettings}>General</TabButton>
                <TabButton tabId="data" currentTab={activeTab} onClick={() => setActiveTab('data')} Icon={FiSave}>Data Controls</TabButton>
                <TabButton tabId="beta" currentTab={activeTab} onClick={() => setActiveTab('beta')} Icon={FiGift}>Beta Features</TabButton>
              </nav>

              {/* Tab Content */}
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
                    {/* TODO: Add Font Size and Message Density controls here */}
                     <div>
                        <label htmlFor="enterToSend" className="flex items-center text-sm font-medium text-[var(--text-secondary)]">
                            <input type="checkbox" id="enterToSend" checked={enterToSend} onChange={() => setEnterToSend(!enterToSend)} className="mr-2 h-4 w-4 rounded text-[var(--color-primary)] border-[var(--border-color)] focus:ring-[var(--color-primary)]"/>
                            Send message on Enter (Shift+Enter for new line)
                        </label>
                    </div>
                  </div>
                )}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Export Chat Data</label>
                      <div className="flex gap-3">
                        <button onClick={() => handleExportData('json')} className="flex-1 flex items-center justify-center px-4 py-2.5 border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <FiDownload className="w-4 h-4 mr-2"/> Export as JSON
                        </button>
                        <button onClick={() => handleExportData('md')} className="flex-1 flex items-center justify-center px-4 py-2.5 border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <FiDownload className="w-4 h-4 mr-2"/> Export as Markdown
                        </button>
                      </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Manage Data</label>
                        <button onClick={handleClearChatsWithConfirmation} className="w-full flex items-center justify-center px-4 py-2.5 border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md text-sm font-medium transition-colors">
                            <FiTrash2 className="w-4 h-4 mr-2"/> Clear All Chat Data
                        </button>
                    </div>
                    <div>
                        <label htmlFor="shareTrainingData" className="flex items-center text-sm font-medium text-[var(--text-secondary)]">
                            <input type="checkbox" id="shareTrainingData" checked={shareDataForTraining} onChange={() => setShareDataForTraining(!shareDataForTraining)} className="mr-2 h-4 w-4 rounded text-[var(--color-primary)] border-[var(--border-color)] focus:ring-[var(--color-primary)]"/>
                            Share anonymized data to help improve ChatNPT (UI Only)
                        </label>
                    </div>
                  </div>
                )}
                 {activeTab === 'beta' && (
                  <div className="space-y-6">
                     <div>
                        <label htmlFor="shareLink" className="flex items-center text-sm font-medium text-[var(--text-secondary)]">
                            <input type="checkbox" id="shareLink" checked={shareLinkEnabled} onChange={() => setShareLinkEnabled(!shareLinkEnabled)} className="mr-2 h-4 w-4 rounded text-[var(--color-primary)] border-[var(--border-color)] focus:ring-[var(--color-primary)]"/>
                            Enable Shareable Chat Links (UI Only)
                        </label>
                        {shareLinkEnabled && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                                When enabled, a mock share button would appear to generate a conceptual link like: <code>/chatllm/s/mock-share-id</code>
                            </p>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">More Coming Soon...</h4>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">We're always working on new features. Check back later!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SettingsModal);