import React from 'react';
import { FiZap, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingStep } from '@/hooks/useChatLogic';

interface ThinkingBubbleProps {
  steps: ThinkingStep[];
}

const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ steps }) => {
  const [expanded, setExpanded] = React.useState(true);
  if (!steps || steps.length === 0) return null;

  const bubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  };

  const stepListVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: "easeInOut", when: "beforeChildren", staggerChildren: 0.05 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeIn" } },
  };
  
  const stepItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  };

  const renderFormattedStep = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const boldParts = text.split('**');

    boldParts.forEach((boldPart, i) => {
      if (i % 2 === 1) {
        elements.push(<strong key={`bold-${i}`} className="font-semibold text-[var(--text-primary)]">{boldPart}</strong>);
      } else {
        const codeParts = boldPart.split('`');
        codeParts.forEach((codePart, j) => {
          if (j % 2 === 1) {
            elements.push(<code key={`code-${i}-${j}`} className="text-xs bg-[var(--inline-code-bg)] text-[var(--inline-code-text)] px-1 py-0.5 rounded font-mono">{codePart}</code>);
          } else if (codePart) {
            elements.push(<React.Fragment key={`text-${i}-${j}`}>{codePart}</React.Fragment>);
          }
        });
      }
    });
    return elements;
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
        <FiZap className="w-5 h-5 text-[var(--color-warning)]" />
      </div>
      <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full px-4 py-3 rounded-xl shadow-md bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-bl-none">
        <div className="flex items-center justify-between mb-2 gap-2">
          <p className="font-medium text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
            Thinking Process...
          </p>
          <button
            aria-label={expanded ? 'Sembunyikan proses berpikir' : 'Tampilkan proses berpikir'}
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition text-[var(--text-tertiary)]"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={expanded ? 'eye-off' : 'eye'}
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {expanded ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.ul 
              className="list-none pl-0 space-y-2.5 text-sm overflow-hidden"
              variants={stepListVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {steps.map((step, index) => (
                <motion.li key={step.id || index} variants={stepItemVariants} className="flex items-start gap-2 leading-relaxed">
                  <FiZap className="w-3 h-3 mt-1.5 text-[var(--color-warning)]/70 flex-shrink-0" />
                  <span>{renderFormattedStep(step.text)}</span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default React.memo(ThinkingBubble);