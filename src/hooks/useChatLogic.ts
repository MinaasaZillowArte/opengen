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
  sendMessage: (prompt: string, userMessageAlreadyAdded?: boolean) => Promise<void>;
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
    const lastAiMessage = messages.findLast(msg => msg.speaker === 'ai' && !msg.error && msg.text !== "Generation stopped by user.");
    if (lastAiMessage && messages[messages.length-1].id === lastAiMessage.id && isLoading) {
        currentAiMessageId = lastAiMessage.id;
    }


    let lineBuffer = '';

    if (currentModelAlias === "ChatNPT 1.0 Think") {
      setThinkingSteps([]);
    }

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
            const parsedStreamChunks = parseStreamChunk(sseMessageLine);
            let accumulatedText = "";
            let newThinkingStepsBatch: ThinkingStep[] = [];
            let streamErrorInBatch: string | undefined;
            let isFinalInBatch = false;

            for (const chunk of parsedStreamChunks) {
              if (chunk.error) {
                streamErrorInBatch = chunk.error;
                isFinalInBatch = true; // Error implies finality for this batch
                break; 
              }
              if (chunk.isFinalChunk) {
                isFinalInBatch = true;
              }
              if (chunk.text) {
                if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
                  newThinkingStepsBatch.push({ id: chunk.id || Date.now().toString(), text: chunk.text });
                } else {
                  accumulatedText += chunk.text;
                }
              }
            }

            if (streamErrorInBatch) {
              throw new Error(streamErrorInBatch);
            }

            if (newThinkingStepsBatch.length > 0) {
              setThinkingSteps(prev => [...prev, ...newThinkingStepsBatch]);
            }

            if (accumulatedText) {
              if (!currentAiMessageId) {
                const newAiMessageId = Date.now().toString(36) + Math.random().toString(36).substring(2,9);
                addMessageHelper('ai', accumulatedText, undefined, newAiMessageId);
                currentAiMessageId = newAiMessageId;
              } else {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === currentAiMessageId ? { ...m, text: m.text + accumulatedText } : m
                  )
                );
              }
            }

            // Handle empty response if this batch was final and produced no output
            if (isFinalInBatch && !currentAiMessageId && !accumulatedText && newThinkingStepsBatch.length === 0) {
              setMessages(prevMessages => {
                const lastPrevMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
                if (lastPrevMessage && lastPrevMessage.speaker === 'user') {
                  // If the last message was user, and AI gives an empty final response.
                  return [...prevMessages, { id: Date.now().toString(36) + Math.random().toString(36).substring(2,9) + "-empty-final", text: "", speaker: 'ai', timestamp: Date.now(), error: "AI response was empty.", modelAliasUsed: currentModelAlias }];
                }
                return prevMessages;
              });
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
  }, [currentModelAlias, addMessageHelper, messages, isLoading]);

  // Modifikasi sendMessage
  const sendMessage = useCallback(async (prompt: string, userMessageAlreadyAdded: boolean = false) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    if (!userMessageAlreadyAdded) {
      addMessageHelper('user', prompt);
    }

    if (currentModelAlias === "ChatNPT 1.0 Think") {
        setThinkingSteps([]);
    }

    abortControllerRef.current = new AbortController();

    try {
      
      let historyMessages = [...messages];
      if (!userMessageAlreadyAdded) {
      } else {
      }
      const lastMessageIsCurrentPromptUser = historyMessages.length > 0 &&
                                         historyMessages[historyMessages.length - 1].speaker === 'user' &&
                                         historyMessages[historyMessages.length - 1].text === prompt;

      if (!lastMessageIsCurrentPromptUser && !userMessageAlreadyAdded) {
      }


      const historyToSend = historyMessages
        .filter(msg => !(msg.speaker === 'ai' && msg.error))
        .map(msg => ({ role: msg.speaker === 'user' ? 'user' : ('assistant' as 'user' | 'assistant'), content: msg.text }));

      const response = await fetch('/api/chat', { //
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
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
        } catch (jsonError) { }
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