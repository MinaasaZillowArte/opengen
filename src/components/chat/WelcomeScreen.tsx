import React from 'react';
import { FiZap, FiCpu, FiEdit3, FiCode, FiGlobe } from 'react-icons/fi'; // Added FiGlobe for "Limitations"
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onPromptSuggestionClick: (prompt: string) => void;
}

const examplePrompts = [
  "Explain quantum computing in simple terms",
  "Write a python script to sort files by extension",
  "What are some tips for learning a new language?",
  "Draft an email to my team about a project update",
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSuggestionClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <img src="/opengen.svg" alt="ChatNPT Logo" className="w-16 h-16 md:w-20 md:h-20 text-[var(--color-primary)] mx-auto" />
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-4 mb-2">
          ChatNPT Experimental
        </h1>
        <p className="text-md md:text-lg text-[var(--text-secondary)]">
          Your AI assistant for creativity, coding, and more. Powered by OpenGen.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl w-full mb-10">
        <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center">
            <FiZap className="w-4 h-4 mr-2 text-[var(--color-secondary)]" />
            Capabilities
          </h3>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 text-left list-disc list-inside pl-1">
            <li>Answers follow-up questions.</li>
            <li>Generates various creative text formats.</li>
            <li>Assists with coding and debugging.</li>
            <li>Explains complex topics simply.</li>
          </ul>
        </div>
        <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center">
            <FiGlobe className="w-4 h-4 mr-2 text-[var(--color-warning)]" /> {/* Menggunakan FiGlobe untuk batasan */}
            Limitations
          </h3>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 text-left list-disc list-inside pl-1">
            <li>May occasionally generate incorrect info.</li>
            <li>Knowledge cutoff (not real-time).</li>
            <li>May produce biased content at times.</li>
            <li>Conversational context is limited.</li>
          </ul>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full max-w-2xl">
        <h3 className="text-md font-semibold text-[var(--text-primary)] mb-3">Example Prompts:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
          {examplePrompts.map((prompt, index) => (
            <motion.button
              key={index}
              onClick={() => onPromptSuggestionClick(prompt)}
              className="w-full text-left p-3 bg-[var(--card-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
        <motion.p variants={itemVariants} className="text-xs text-[var(--text-tertiary)] mt-10">
            ChatNPT is experimental. Your feedback helps us improve!
        </motion.p>
    </motion.div>
  );
};

export default React.memo(WelcomeScreen);