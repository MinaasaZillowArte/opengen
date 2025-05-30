import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiTrash2, FiPaperclip, FiMic, FiSquare, FiLoader } from 'react-icons/fi'; // FiSquare for Stop
import { motion } from 'framer-motion';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  // enterToSend: boolean; // For settings later
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, onStopGeneration }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if (enterToSend && event.key === 'Enter' && !event.shiftKey) {
    if (event.key === 'Enter' && !event.shiftKey) { // Default: Enter to send
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleClearInput = useCallback(() => {
    setInputValue('');
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="p-3 md:p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="flex items-end gap-2 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-shadow">
        <button
            title="Attach file (placeholder)"
            className="p-2.5 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-colors"
            disabled={isLoading}
        >
            <FiPaperclip className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message to ChatNPT..."
          className="flex-grow p-2.5 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none max-h-40 text-sm scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]"
          rows={1}
          disabled={isLoading}
          aria-label="Chat input"
        />
        {inputValue && !isLoading && (
          <button
            onClick={handleClearInput}
            title="Clear input"
            className="p-2.5 text-[var(--text-tertiary)] hover:text-red-500 rounded-md transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        )}
         <button
            title="Voice input (placeholder)"
            className="p-2.5 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] rounded-md transition-colors"
            disabled={isLoading}
        >
            <FiMic className="w-5 h-5" />
        </button>
        {isLoading ? (
          <button
            onClick={onStopGeneration}
            title="Stop generation"
            className="p-2.5 bg-[var(--color-error)] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <FiSquare className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            title="Send message"
            disabled={!inputValue.trim()}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center
                        ${inputValue.trim() ? 'bg-[var(--color-primary)] text-white hover:bg-opacity-90' 
                                            : 'bg-[var(--button-secondary-bg)] text-[var(--text-tertiary)] cursor-not-allowed'}`}
          >
            {isLoading && false ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(InputArea);