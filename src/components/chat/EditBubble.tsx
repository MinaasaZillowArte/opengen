import React, { useRef, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';

interface EditBubbleProps {
  editText: string;
  setEditText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditBubble: React.FC<EditBubbleProps> = ({
  editText,
  setEditText,
  onSave,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex justify-end my-3 items-end gap-2.5">
      <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div className="bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--color-primary)] shadow-md">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 bg-transparent text-[var(--text-primary)] resize-none outline-none text-sm"
            rows={1}
          />
          <div className="flex justify-end items-center gap-2 mt-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-opacity-90 rounded-md transition-colors"
            >
              Save & Submit
            </button>
          </div>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0">
        <FiEdit className="w-5 h-5 text-[var(--color-primary)]" />
      </div>
    </div>
  );
};

export default React.memo(EditBubble);