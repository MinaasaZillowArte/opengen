import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCpu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelOption {
  alias: string;
  description: string;
}

const models: ModelOption[] = [
  { alias: "NPT 1.0", description: "Balanced model for general tasks." },
  { alias: "NPT 1.0 Think", description: "Best for Coding, Math and Complex Task." },
  { alias: "NPT 1.5", description: "Our Best Reasoning Models" },
  { alias: "NPT 1.5 Fast", description: "Fast and efficient for Light Tasks." },
];

interface ModelSelectorProps {
  currentModelAlias: string;
  onModelChange: (alias: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModelAlias, onModelChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find(m => m.alias === currentModelAlias) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-full rounded-md border border-[var(--border-color)] shadow-sm px-4 py-2 bg-[var(--button-bg)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--button-hover-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--color-primary)] transition-colors duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          id="options-menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {selectedModel.alias}
          <FiChevronDown className="-mr-1 ml-2 h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 origin-top rounded-md shadow-lg bg-[var(--card-bg)] ring-1 ring-[var(--border-color)] ring-opacity-5 focus:outline-none z-10 py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {models.map((model) => (
              <button
                key={model.alias}
                onClick={() => {
                  onModelChange(model.alias);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150"
                role="menuitem"
              >
                <div className="font-medium text-[var(--text-primary)]">{model.alias}</div>
                <p className="text-xs text-[var(--text-tertiary)]">{model.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(ModelSelector);