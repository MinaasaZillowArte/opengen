import React, { useState, useCallback } from 'react';
import { FiCopy, FiUser, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

import { Message } from '@/hooks/useChatLogic';

interface MessageBubbleProps {
    message: Message;
    isDarkMode: boolean;
    isLastMessage: boolean;
    isStreamingAi: boolean;
  }

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode }) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopyCode = useCallback((textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    }).catch(err => console.error("Failed to copy:", err));
  }, []);

  const isUser = message.speaker === 'user';
  const codeTheme = isDarkMode ? oneDark : oneLight;

  const bubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div
      layout="position"
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-start gap-2.5 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0 mt-1">
          <img src="/opengen.svg" className="w-5 h-5" alt="OpenGen" />
        </div>
      )}
      <div
        className={`relative group/bubble max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl px-4 py-3 rounded-xl shadow-md prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-li:my-0.5 prose-blockquote:my-2 prose-pre:p-0 prose-pre:bg-transparent
                    ${
                      isUser ? 'bg-[var(--color-primary)] text-white rounded-br-none prose-strong:text-white prose-code:text-white'
                              : 'bg-[var(--card-bg)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)]'
                    }
                    ${message.feedback === 'liked' ? 'border-green-500/50' : ''}
                    ${message.feedback === 'disliked' ? 'border-red-500/50' : ''}
                    prose-code:bg-[var(--inline-code-bg)] prose-code:text-[var(--inline-code-text)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                    ${message.error ? 'border-red-500/50 bg-red-500/10' : ''}
                  `}
      >
        {message.error && (
          <div className="flex items-center text-red-700 dark:text-red-400 text-xs mb-2">
            <FiAlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>Error: {message.error === 'aborted' ? 'Generation stopped by user.' : message.error}</span>
          </div>
        )}
        <ReactMarkdown
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkMath, remarkGfm]}
          components={{
            code(props) {
              const { children, className, node, ref, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');
              const codeText = String(children).replace(/\n$/, '');
              const codeBlockId = `code-${message.id}-${node?.position?.start.line}`;

              return match ? (
                <div className="relative group/codeblock my-2">
                  <SyntaxHighlighter
                    {...rest}
                    style={codeTheme}
                    language={match[1]}
                    PreTag="div"
                    className="!bg-[var(--code-bg)] !p-3 !text-xs rounded-md scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]"
                    showLineNumbers
                  >
                    {codeText}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopyCode(codeText, codeBlockId)}
                    className="absolute top-2 right-2 p-1.5 bg-[var(--bg-tertiary)]/80 rounded opacity-0 group-hover/codeblock:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--color-primary)] backdrop-blur-sm"
                    title={copiedStates[codeBlockId] ? "Copied!" : "Copy code"}
                  >
                    {copiedStates[codeBlockId] ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <code {...rest} className={className} ref={ref}>
                  {children}
                </code>
              );
            },
            table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-[var(--border-color)] px-2 py-1 text-left" {...props} />,
            td: ({node, ...props}) => <td className="border border-[var(--border-color)] px-2 py-1" {...props} />,
          }}
        >
          {message.text || (message.error ? '' : '\u200B')}
        </ReactMarkdown>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--accent-bg-light)] flex items-center justify-center flex-shrink-0 mt-1">
          <FiUser className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(MessageBubble);