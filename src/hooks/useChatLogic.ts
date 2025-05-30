// src/hooks/useChatLogic.ts
import { useState, useCallback, useRef } from 'react';
import { parseStreamChunk } from '@/utils/streamParser';

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

export function useChatLogic({
  initialMessages = [],
  defaultModelAlias = "ChatNPT 1.0",
}: UseChatLogicParams = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelAlias, setCurrentModelAlias] = useState<string>(defaultModelAlias);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessageHelper = useCallback((speaker: 'user' | 'ai', text: string, errorMsg?: string, customId?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: customId || Date.now().toString() + Math.random(),
        text,
        speaker,
        timestamp: Date.now(),
        error: errorMsg,
        modelAliasUsed: speaker === 'ai' ? currentModelAlias : undefined
      },
    ]);
  }, [currentModelAlias]);

  const processAndSetStream = useCallback(async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let currentAiMessageId: string | null = null;
    let lineBuffer = '';

    if (currentModelAlias === "ChatNPT 1.0 Think") {
      setThinkingSteps([]);
    }

    setIsLoading(true);

    try {
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Stream reading aborted by user.");
          if (currentAiMessageId) {
            setMessages(prev => prev.map(m => m.id === currentAiMessageId ? {...m, error: "aborted", text: m.text || "Generation stopped." } : m));
          } else if (messages[messages.length -1]?.speaker === 'user') {
            addMessageHelper('ai', "Generation stopped by user.", "aborted");
          }
          break;
        }

        const { value, done } = await reader.read();
        if (done) {
          if (lineBuffer.trim().startsWith('data:')) {
            const parsedStreamChunks = parseStreamChunk(lineBuffer.trim());
            for (const chunk of parsedStreamChunks) {
              if (chunk.error) throw new Error(chunk.error);
              if (chunk.text) {
                if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
                  setThinkingSteps(prev => [...prev, { id: chunk.id || Date.now().toString() + Math.random(), text: chunk.text! }]);
                } else {
                  if (!currentAiMessageId) {
                    const newAiMessageId = Date.now().toString() + Math.random();
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
            const parsedStreamChunks = parseStreamChunk(sseMessageLine);
            for (const chunk of parsedStreamChunks) {
              if (chunk.error) throw new Error(chunk.error);

              if (chunk.text) {
                if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
                  setThinkingSteps(prev => [...prev, { id: chunk.id || Date.now().toString() + Math.random(), text: chunk.text! }]);
                } else {
                  if (!currentAiMessageId) {
                    const newAiMessageId = Date.now().toString() + Math.random();
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
              
              if (chunk.isFinalChunk && currentAiMessageId) {
                // console.log("Final chunk received for AI message:", currentAiMessageId);
              } else if (chunk.isFinalChunk && !currentAiMessageId && messages[messages.length -1]?.speaker !== 'user') {
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
      } else if (messages[messages.length -1]?.speaker === 'user') {
        addMessageHelper('ai', "", errorMessage);
      }
      setError("Error processing AI response: " + errorMessage);
    } finally {
      setIsLoading(false);
      if (reader) reader.releaseLock();
    }
  }, [currentModelAlias, addMessageHelper, messages]);


  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    addMessageHelper('user', prompt);
    
    if (currentModelAlias === "ChatNPT 1.0 Think") {
        setThinkingSteps([]);
    }

    abortControllerRef.current = new AbortController();

    try {
      const historyToSend = messages
        .filter(msg => !(msg.speaker === 'ai' && msg.error))
        .map(msg => ({ role: msg.speaker as 'user' | 'assistant', content: msg.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: historyToSend, modelAlias: currentModelAlias }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        let errorText = `Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorText = errorData.error || errorData.details || errorText;
        } catch (jsonError) {
            //
        }
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
        addMessageHelper('ai', "", specificError);
      }
      setIsLoading(false);
    }
  }, [isLoading, addMessageHelper, messages, currentModelAlias, processAndSetStream]);
  
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Generation stop requested.");
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
  };
}