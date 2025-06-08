import React, { useState, useCallback } from 'react';
import { FiCopy, FiUser, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

  const processTextForKatex = (text: string): string => {
    if (!text) return '';
    let processedText = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    processedText = processedText.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    return processedText;
  };

  const isUser = message.speaker === 'user';
  const textToRender = processTextForKatex(message.text || (message.error ? '' : '\u200B'));

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
        className={`message-content relative group/bubble max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl px-4 py-3 rounded-xl shadow-md
                    ${
                      isUser ? 'bg-[var(--color-primary)] text-white rounded-br-none'
                              : 'bg-[var(--card-bg)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)]'
                    }
                    ${message.feedback === 'liked' ? 'border-green-500/50' : ''}
                    ${message.feedback === 'disliked' ? 'border-red-500/50' : ''}
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
                <div className="my-2 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <div className="flex justify-between items-center px-4 py-1.5 bg-gray-800 text-xs text-gray-400">
                    <span>{match[1]}</span>
                    <button
                      onClick={() => handleCopyCode(codeText, codeBlockId)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                      title={copiedStates[codeBlockId] ? "Copied!" : "Copy code"}
                    >
                      {copiedStates[codeBlockId] ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      {copiedStates[codeBlockId] ? "Copied" : "Copy code"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    {...rest}
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="!p-4 !text-xs !bg-transparent scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                    showLineNumbers
                  >
                    {codeText}
                  </SyntaxHighlighter>
                    <p className="px-4 py-2 text-xs text-gray-500 bg-gray-800 border-t border-gray-700">
                      AI-generated code. Review before use.
                    </p>
                </div>
              ) : (
                <code {...rest} className={`inline-code ${className}`} ref={ref}>
                  {children}
                </code>
              );
            },
            table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-[var(--border-color)] px-2 py-1 text-left" {...props} />,
            td: ({node, ...props}) => <td className="border border-[var(--border-color)] px-2 py-1" {...props} />,
          }}
        >
          {textToRender}
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