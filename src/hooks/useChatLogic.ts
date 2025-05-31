// src/hooks/useChatLogic.ts
import { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { parseStreamChunk } from '@/utils/streamParser'; //

export interface Message {
  id: string;
  text: string;
  speaker: 'user' | 'ai';
  timestamp?: number;
  error?: string;
  modelAliasUsed?: string;
}

export interface ThinkingStep {
  id: string;
  text: string;
}

export interface UseChatLogicParams {
  initialMessages?: Message[];
  defaultModelAlias?: string;
}

export interface UseChatLogicReturn {
  messages: Message[];
  thinkingSteps: ThinkingStep[];
  isLoading: boolean;
  error: string | null;
  currentModelAlias: string;
  sendMessage: (prompt: string, userMessageAlreadyAdded?: boolean) => Promise<void>; // Modifikasi di sini
  setCurrentModelAlias: Dispatch<SetStateAction<string>>;
  clearChat: () => void;
  stopGeneration: () => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export function useChatLogic({
  initialMessages = [],
  defaultModelAlias = "ChatNPT 1.0",
}: UseChatLogicParams = {}): UseChatLogicReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelAlias, setCurrentModelAlias] = useState<string>(defaultModelAlias);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessageHelper = useCallback((speaker: 'user' | 'ai', text: string, errorMsg?: string, customId?: string) => {
    setMessages(prev => {
      // Hindari duplikasi jika ID pesan sudah ada (meskipun kecil kemungkinannya dengan customId)
      if (customId && prev.find(msg => msg.id === customId)) {
        return prev.map(msg => msg.id === customId ? { ...msg, text: msg.text + text, error: errorMsg } : msg);
      }
      return [
        ...prev,
        {
          id: customId || Date.now().toString() + Math.random().toString(36).substring(2,9),
          text,
          speaker,
          timestamp: Date.now(),
          error: errorMsg,
          modelAliasUsed: speaker === 'ai' ? currentModelAlias : undefined
        },
      ];
    });
  }, [currentModelAlias]);

  const processAndSetStream = useCallback(async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let currentAiMessageId: string | null = null;
    // Cari AI message terakhir yang mungkin belum selesai (jika ada error sebelumnya dan dilanjutkan)
    const lastAiMessage = messages.findLast(msg => msg.speaker === 'ai' && !msg.error && msg.text !== "Generation stopped by user.");
    if (lastAiMessage && messages[messages.length-1].id === lastAiMessage.id && isLoading) { // Pastikan ini AI message terakhir & sedang loading
        currentAiMessageId = lastAiMessage.id;
    }


    let lineBuffer = '';

    if (currentModelAlias === "ChatNPT 1.0 Think") { //
      setThinkingSteps([]);
    }

    // setIsLoading(true); // isLoading sudah di-set di sendMessage

    try {
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Stream reading aborted by user.");
          if (currentAiMessageId) {
            setMessages(prev => prev.map(m => m.id === currentAiMessageId ? {...m, error: "aborted", text: m.text || "Generation stopped." } : m));
          } else if (messages.length > 0 && messages[messages.length -1]?.speaker === 'user') {
             addMessageHelper('ai', "Generation stopped by user.", "aborted");
          }
          break;
        }

        const { value, done } = await reader.read();
        if (done) {
          // Proses sisa buffer jika ada
          if (lineBuffer.trim().startsWith('data:')) {
            const parsedStreamChunks = parseStreamChunk(lineBuffer.trim()); //
            for (const chunk of parsedStreamChunks) {
              if (chunk.error) throw new Error(chunk.error);
              if (chunk.text) {
                if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) { //
                  setThinkingSteps(prev => [...prev, { id: chunk.id || Date.now().toString(), text: chunk.text! }]);
                } else {
                  if (!currentAiMessageId) {
                    const newAiMessageId = Date.now().toString(36) + Math.random().toString(36).substring(2,9);
                    addMessageHelper('ai', chunk.text!, undefined, newAiMessageId);
                    currentAiMessageId = newAiMessageId;
                  } else {
                    setMessages(prev => prev.map(m => m.id === currentAiMessageId ? { ...m, text: m.text + chunk.text! } : m));
                  }
                }
              }
            }
          }
          break;
        }

        const decodedHttpChunk = decoder.decode(value, { stream: true });
        lineBuffer += decodedHttpChunk;

        let newlineIndex;
        while ((newlineIndex = lineBuffer.indexOf('\n')) >= 0) {
          const sseMessageLine = lineBuffer.substring(0, newlineIndex).trim();
          lineBuffer = lineBuffer.substring(newlineIndex + 1);

          if (sseMessageLine.startsWith('data: ')) {
            const parsedStreamChunks = parseStreamChunk(sseMessageLine); //
            for (const chunk of parsedStreamChunks) {
              if (chunk.error) throw new Error(chunk.error);

              if (chunk.text) {
                if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) { //
                  setThinkingSteps(prev => [...prev, { id: chunk.id || Date.now().toString(), text: chunk.text! }]);
                } else {
                  if (!currentAiMessageId) {
                    const newAiMessageId = Date.now().toString(36) + Math.random().toString(36).substring(2,9);
                    addMessageHelper('ai', chunk.text!, undefined, newAiMessageId);
                    currentAiMessageId = newAiMessageId;
                  } else {
                    setMessages(prev =>
                      prev.map(m =>
                        m.id === currentAiMessageId ? { ...m, text: m.text + chunk.text! } : m
                      )
                    );
                  }
                }
              }
              
              if (chunk.isFinalChunk && !currentAiMessageId && messages.length > 0 && messages[messages.length -1]?.speaker !== 'user') {
                const lastMsg = messages[messages.length -1];
                if(lastMsg && lastMsg.speaker === 'ai' && !lastMsg.text && !lastMsg.error){
                    setMessages(prev => prev.map(m => m.id === lastMsg.id ? {...m, error: "Empty response from AI." } : m));
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Stream processing error:", e);
      const errorMessage = e.message || "Stream processing failed";
      if (currentAiMessageId) {
        setMessages(prev => prev.map(m => m.id === currentAiMessageId ? {...m, error: errorMessage, text: m.text || "" } : m));
      } else if (messages.length > 0 && messages[messages.length -1]?.speaker === 'user') {
        addMessageHelper('ai', "", errorMessage);
      }
      setError("Error processing AI response: " + errorMessage);
    } finally {
      setIsLoading(false);
      if (reader) reader.releaseLock();
    }
  }, [currentModelAlias, addMessageHelper, messages, isLoading]); // isLoading ditambahkan

  // Modifikasi sendMessage
  const sendMessage = useCallback(async (prompt: string, userMessageAlreadyAdded: boolean = false) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Pesan pengguna ditambahkan di sini HANYA jika belum ditambahkan oleh pemanggil
    if (!userMessageAlreadyAdded) {
      addMessageHelper('user', prompt);
    }
    // Jika userMessageAlreadyAdded = true, berarti `messages` state sudah di-update
    // oleh `setLogicMessages` di page.tsx sebelum memanggil sendMessage ini.

    if (currentModelAlias === "ChatNPT 1.0 Think") { //
        setThinkingSteps([]);
    }

    abortControllerRef.current = new AbortController();

    try {
      // Ambil `messages` TERKINI dari state untuk membangun history
      // Karena `addMessageHelper` atau `setMessages` (via `setLogicMessages`) adalah async,
      // lebih aman membangun history dari state `messages` yang akan di-resolve di render berikutnya,
      // atau pastikan state `messages` sudah di-update sebelum baris ini.
      // Untuk keamanan, kita bisa mengkonstruksi history dari `messages` saat ini,
      // lalu tambahkan prompt pengguna terakhir jika belum ada.
      
      let historyMessages = [...messages]; // Salin messages saat ini
      if (!userMessageAlreadyAdded) {
          // Jika pesan user baru saja ditambahkan oleh addMessageHelper di atas,
          // state messages mungkin belum terupdate di sini.
          // Maka, tambahkan secara manual ke salinan untuk history.
          // Ini adalah asumsi bahwa addMessageHelper akan segera dieksekusi.
          // Alternatifnya, addMessageHelper bisa return ID pesan baru, lalu kita tunggu.
          // Untuk sekarang, kita asumsikan prompt akan jadi pesan user terakhir di `messages` yang akan datang.
          // Cara paling aman: `messages` state di-passing ke `sendMessage` atau selalu update state dulu.
          // Karena `messages` ada di dependency array useCallback, ia akan selalu up-to-date.
      } else {
          // Jika userMessageAlreadyAdded, berarti `messages` sudah di-set dengan benar dari luar.
      }
      // Pastikan pesan prompt pengguna terakhir ada di history jika belum
      const lastMessageIsCurrentPromptUser = historyMessages.length > 0 &&
                                         historyMessages[historyMessages.length - 1].speaker === 'user' &&
                                         historyMessages[historyMessages.length - 1].text === prompt;

      if (!lastMessageIsCurrentPromptUser && !userMessageAlreadyAdded) {
          // Jika `addMessageHelper` belum menambahkan prompt ke `historyMessages` (karena sifat async setState)
          // dan ini bukan kasus dimana pesan sudah ada, tambahkan secara eksplisit ke history.
          // Ini adalah fallback, idealnya `messages` sudah mengandung prompt ini.
          // Untuk hook ini, `addMessageHelper` sudah dipanggil jika `!userMessageAlreadyAdded`.
          // Jadi `messages` akan segera terupdate.
      }


      const historyToSend = historyMessages // Gunakan messages yang sudah diupdate dari state
        .filter(msg => !(msg.speaker === 'ai' && msg.error))
        .map(msg => ({ role: msg.speaker === 'user' ? 'user' : ('assistant' as 'user' | 'assistant'), content: msg.text }));

      const response = await fetch('/api/chat', { //
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt, // Prompt tetap dikirim untuk konteks API
            history: historyToSend,
            modelAlias: currentModelAlias //
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        let errorText = `Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorText = errorData.error || errorData.details || errorText;
        } catch (jsonError) { /* Biarkan errorText default */ }
        throw new Error(errorText);
      }
      await processAndSetStream(response.body);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("Request aborted by user.");
      } else {
        console.error("Error sending message:", e);
        const specificError = e.message || "Failed to get response from AI.";
        setError(specificError);
        const lastMessageIsUser = messages.length > 0 && messages[messages.length-1].speaker === 'user';
        // Hanya tambahkan bubble error AI jika pesan terakhir adalah dari user dan belum ada respons AI
        if (lastMessageIsUser && (!messages.find(m => m.speaker==='ai' && m.id === messages[messages.length-1].id +'-ai'))) { // Cek sederhana
           addMessageHelper('ai', "", specificError);
        }
      }
      setIsLoading(false);
    }
  }, [isLoading, addMessageHelper, messages, currentModelAlias, processAndSetStream]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Generation stop requested.");
      // State error dan isLoading akan diurus oleh processAndSetStream
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setThinkingSteps([]);
    setError(null);
    setIsLoading(false);
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    thinkingSteps,
    isLoading,
    error,
    currentModelAlias,
    sendMessage,
    setCurrentModelAlias,
    clearChat,
    stopGeneration,
    setMessages,
  };
}