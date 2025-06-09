'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatSession } from '@/types/chat';
import MessageBubble from '@/components/chat/MessageBubble';
import { FiShare2, FiLoader, FiAlertTriangle } from 'react-icons/fi';

function SharedChatDisplay() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const darkModePreference = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(darkModePreference);
    }
  }, []);


  useEffect(() => {
    if (chatId) {
      const fetchChat = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/share?id=${chatId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch shared chat.');
          }
          const data = await response.json();
          if (data.success) {
            setSession(data.chatSession);
          } else {
            throw new Error(data.message);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchChat();
    }
  }, [chatId]);

  return (
    <div className={`theme-${isDarkMode ? 'dark' : 'light'} min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans`}>
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-4 shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
                <FiShare2 className="w-5 h-5 text-[var(--color-primary)]"/>
                <h1 className="text-lg font-semibold truncate">{session ? session.title : 'Shared Conversation'}</h1>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 text-center text-xs text-[var(--text-secondary)] mb-6">
                This is a shared, read-only conversation.
            </div>

            {loading && (
                <div className="flex justify-center items-center p-10">
                    <FiLoader className="w-8 h-8 animate-spin text-[var(--color-primary)]"/>
                </div>
            )}

            {error && (
                 <div className="flex flex-col items-center justify-center p-10 bg-[var(--bg-tertiary)] rounded-lg">
                    <FiAlertTriangle className="w-10 h-10 text-[var(--color-error)] mb-3"/>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">Chat not found</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
                </div>
            )}
            
            {session && (
                <div className="space-y-2">
                    {session.messages.map((message, index) => (
                        <MessageBubble key={message.id || index} message={message} isDarkMode={isDarkMode} isLastMessage={index === session.messages.length - 1} isStreamingAi={false} />
                    ))}
                </div>
            )}
        </main>
         <footer className="text-center py-4 mt-8 border-t border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)]">
                Shared via OpenGen
            </p>
        </footer>
    </div>
  );
}


export default function SharedChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">Loading shared chat...</div>}>
            <SharedChatDisplay />
        </Suspense>
    );
}