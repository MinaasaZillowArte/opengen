import React from 'react';
import { FiZap } from 'react-icons/fi'; // Or FiEye as in page.tsx
import { motion } from 'framer-motion';
import { ThinkingStep } from '@/hooks/useChatLogic'; // Adjust path

interface ThinkingBubbleProps {
  steps: ThinkingStep[];
}

const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  const bubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  };
  
  const stepVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const renderFormattedStep = (text: string): React.ReactNode => {
    // Basic bold and inline code formatting for thinking steps
    const boldParts = text.split('**');
    return boldParts.map((part, i) => {
        if (i % 2 === 1) { return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part}</strong>; }
        const codeParts = part.split('`');
        return codeParts.map((codePart, j) => {
            if (j % 2 === 1) { return <code key={`${i}-${j}`} className="text-xs bg-[var(--inline-code-bg)] text-[var(--inline-code-text)] px-1 py-0.5 rounded font-mono">{codePart}</code>; }
            return <React.Fragment key={`${i}-${j}`}>{codePart}</React.Fragment>;
        });
    });
  };


  return (
    <motion.div
      layout="position"
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className="flex items-start gap-2.5 my-3 justify-start"
    >
      <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center flex-shrink-0 mt-1">
        <FiZap className="w-5 h-5 text-[var(--color-warning)]" /> {/* Using FiZap as in page.tsx example for "thinking" */}
      </div>
      <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl px-4 py-3 rounded-xl shadow-md bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-bl-none">
        <p className="font-medium text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
          Thinking Process...
        </p>
        <motion.ul 
            className="list-none pl-0 space-y-1.5 text-sm"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 }}}}
        >
          {steps.map((step, index) => (
            <motion.li key={step.id || index} variants={stepVariants} className="flex items-start gap-1.5">
              <FiZap className="w-3 h-3 mt-1 text-[var(--color-warning)]/70 flex-shrink-0" />
              <span>{renderFormattedStep(step.text)}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
};

export default React.memo(ThinkingBubble);