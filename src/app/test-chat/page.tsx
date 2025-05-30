// src/app/test-chat/page.tsx
'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiSend, FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Tambahkan ikon

interface TestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean; // Tambahkan flag untuk pesan error
}

export default function TestChatPage() {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<TestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Untuk error global/non-chat
  const currentAiMessageIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Untuk auto-scroll

  // Auto-scroll ke bawah saat ada pesan baru atau loading
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [chatHistory, isLoading]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    
    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: TestMessage = { id: userMessageId, role: 'user', content: prompt };
    
    const currentChatHistoryForAPI = [...chatHistory]; 
    setChatHistory(prev => [...prev, newUserMessage]);
    
    currentAiMessageIdRef.current = null;

    console.log('[TEST-CHAT] Sending to /api/chat. Payload:', {
      prompt: prompt,
      history: currentChatHistoryForAPI.map(m => ({role: m.role, content: m.content})),
      modelAlias: "ChatNPT 1.0"
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          history: currentChatHistoryForAPI.map(m => ({role: m.role, content: m.content})),
          modelAlias: "ChatNPT 1.0" // Sesuaikan dengan model yang diuji
        }),
      });

      console.log('[TEST-CHAT] API Response Status:', response.status);

      if (!response.ok || !response.body) {
        const errText = await response.text();
        console.error('[TEST-CHAT] API Error:', response.status, errText);
        const errorContent = `Error from API: ${errText || response.statusText} (Status: ${response.status})`;
        const errorAiId = `ai-error-${Date.now()}`;
        setChatHistory(prev => [...prev, {id: errorAiId, role: 'assistant', content: errorContent, isError: true}]);
        setError(errorContent); // Set error global juga
        throw new Error(errorContent);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[TEST-CHAT] Stream finished.');
          currentAiMessageIdRef.current = null;
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        console.log('[TEST-CHAT] Stream chunk received (raw):', chunk);
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.substring('data: '.length).trim();
            if (jsonString === '[DONE]') {
                 console.log('[TEST-CHAT] Stream explicit [DONE] received.');
                 currentAiMessageIdRef.current = null;
                 break; 
            }
            try {
              const parsed = JSON.parse(jsonString);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                console.log('[TEST-CHAT] Stream content part:', content);
                if (!currentAiMessageIdRef.current) {
                  const newAiId = `ai-${Date.now()}`;
                  currentAiMessageIdRef.current = newAiId;
                  setChatHistory(prev => [...prev, { id: newAiId, role: 'assistant', content: content }]);
                } else {
                  setChatHistory(prev => prev.map(msg => 
                    msg.id === currentAiMessageIdRef.current 
                      ? { ...msg, content: msg.content + content } 
                      : msg
                  ));
                }
              }
            } catch (e) {
              console.warn('[TEST-CHAT] Failed to parse JSON from stream line:', jsonString, e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[TEST-CHAT] Error during handleSubmit:', err);
      if (!error) { // Hanya set error global jika belum di-set oleh API error di atas
        setError(err.message || 'An unknown error occurred.');
      }
      // Pesan error sudah ditambahkan ke chatHistory jika berasal dari API
      // Untuk error lain, bisa tambahkan pesan error generik jika belum ada
      if (!chatHistory.find(msg => msg.id === currentAiMessageIdRef.current && msg.isError)) {
        const genericErrorId = `ai-generic-error-${Date.now()}`;
         if(!currentAiMessageIdRef.current){ // Jika error terjadi sebelum AI sempat merespon
            setChatHistory(prev => [...prev, { id: genericErrorId, role: 'assistant', content: `Failed to get response: ${err.message || 'Unknown error'}`, isError: true }]);
         }
      }
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <header className="p-3 md:p-4 border-b border-[var(--border-color)] text-center relative shadow-sm">
        <h1 className="text-lg sm:text-xl font-semibold">Test Chat (Minimal)</h1>
        <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-white p-1 rounded font-mono shadow">
          EXPERIMENTAL
        </span>
      </header>

      <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 border-b border-yellow-300 dark:border-yellow-600 text-center text-xs text-yellow-700 dark:text-yellow-200">
        <p><strong>PERINGATAN:</strong> Ini UI untuk test, bukan versi asli. Saat ini hanya untuk Development Web, bukan Produksi.</p>
      </div>

      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-2 px-3 rounded-lg max-w-[75%] sm:max-w-[70%] md:max-w-[65%] break-words shadow
                            ${msg.role === 'user' 
                                ? 'bg-blue-500 text-white rounded-br-none' 
                                : msg.isError 
                                    ? 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 rounded-bl-none' 
                                    : 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-none'
                            }`}
            >
              <strong className="font-medium">{msg.role === 'user' ? 'You' : 'AI'}:</strong>
              <pre className="text-sm whitespace-pre-wrap font-sans">{msg.content}</pre> {/* pre untuk mempertahankan newline */}
            </div>
          </div>
        ))}
        {isLoading && !currentAiMessageIdRef.current && ( // Tampilkan hanya jika belum ada bubble AI yg di-stream
          <div className="flex justify-start">
            <div className="p-2 px-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] shadow">
              <FiLoader className="w-5 h-5 text-[var(--text-secondary)] animate-spin" />
            </div>
          </div>
        )}
      </div>
      
      {error && !isLoading && ( // Tampilkan error global jika ada dan tidak sedang loading
        <div className="p-2 text-center text-sm bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-200 border-t border-red-300 dark:border-red-600">
          <FiAlertTriangle className="inline w-4 h-4 mr-1" /> {error}
        </div>
      )}

      <div className="p-2 sm:p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)] sticky bottom-0">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1.5 sm:p-2 rounded-xl border border-[var(--border-color)] focus-within:ring-2 focus-within:ring-blue-500">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={1}
            className="flex-grow p-2 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none max-h-28 sm:max-h-32 text-sm scrollbar-thin"
            placeholder="Type your message..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button 
            onClick={handleSubmit} 
            disabled={isLoading || !prompt.trim()} 
            className="p-2 sm:p-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            {isLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}