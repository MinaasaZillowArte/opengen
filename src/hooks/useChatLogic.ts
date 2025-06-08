import { useState, useCallback, useRef, Dispatch, SetStateAction, useEffect } from 'react';
import { parseStreamChunk } from '@/utils/streamParser';

export interface MessageVersion {
  text: string;
  modelAliasUsed: string;
  timestamp: number;
}

export interface Message {
  id: string;
  text: string;
  speaker: 'user' | 'ai';
  timestamp?: number;
  error?: string;
  modelAliasUsed?: string;
  versions?: MessageVersion[];
  activeVersion?: number;
  feedback?: 'liked' | 'disliked';
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
  sendMessage: (prompt: string, userMessageAlreadyAdded?: boolean, regeneratedMessageId?: string) => Promise<void>;
  setCurrentModelAlias: Dispatch<SetStateAction<string>>;
  clearChat: () => void;
  stopGeneration: () => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  handleLike: (messageId: string) => void;
  handleDislike: (messageId: string) => void;
  handleNavigateVersion: (messageId: string, direction: 'prev' | 'next') => void;
  handleRegenerate: (messageId: string) => void;
  handleEditSubmit: (messageId: string, newText: string) => void;
}

const getFriendlyErrorMessage = (errorText: string): string => {
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
            if (errorJson.retryAfter) {
                return `${errorJson.message} Please try again in ${errorJson.retryAfter} seconds.`;
            }
            return errorJson.message;
        }
    } catch (e) {
        // Not a JSON error, return as is or a generic message
    }
    return errorText || "An unexpected error occurred.";
};


export function useChatLogic({
  initialMessages = [],
  defaultModelAlias = "ChatNPT 1.0",
}: UseChatLogicParams = {}): UseChatLogicReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelAlias, setCurrentModelAlias] = useState<string>(defaultModelAlias);
  const currentModelAliasRef = useRef(currentModelAlias);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    currentModelAliasRef.current = currentModelAlias;
  }, [currentModelAlias]);

  const addOrUpdateAiMessage = useCallback((
    id: string,
    textChunk: string,
    isFirstChunk: boolean,
    isError?: boolean,
    errorMessage?: string,
    isRegeneration: boolean = false
  ) => {
    setMessages(prev => {
      const existingMsgIndex = prev.findIndex(msg => msg.id === id);

      if (existingMsgIndex !== -1) {
        const updatedMessages = [...prev];
        const oldMsg = updatedMessages[existingMsgIndex];
        let newMsg: Message;

        if (isRegeneration && isFirstChunk) {
          const newVersion: MessageVersion = {
            text: textChunk,
            modelAliasUsed: currentModelAliasRef.current,
            timestamp: Date.now(),
          };
          const existingVersions = oldMsg.versions || [{ text: oldMsg.text, modelAliasUsed: oldMsg.modelAliasUsed || defaultModelAlias, timestamp: oldMsg.timestamp || Date.now() }];
          
          newMsg = {
              ...oldMsg,
              versions: [...existingVersions, newVersion],
              activeVersion: existingVersions.length,
              text: newVersion.text,
              modelAliasUsed: newVersion.modelAliasUsed,
              error: undefined,
              feedback: undefined,
          };
        } else {
          newMsg = { ...oldMsg };
          const currentActiveVersionIdx = newMsg.activeVersion ?? 0;
          const newVersions = [...(newMsg.versions || [])];
          
          if (newVersions[currentActiveVersionIdx]) {
              const updatedVersion = { ...newVersions[currentActiveVersionIdx] };
              updatedVersion.text += textChunk;
              newVersions[currentActiveVersionIdx] = updatedVersion;

              newMsg.versions = newVersions;
              newMsg.text = updatedVersion.text;
          }
          
          if (isError) {
              newMsg.error = errorMessage;
          }
        }
        updatedMessages[existingMsgIndex] = newMsg;
        return updatedMessages;

      } else if (isFirstChunk) {
        const newVersion: MessageVersion = {
          text: textChunk,
          modelAliasUsed: currentModelAliasRef.current,
          timestamp: Date.now(),
        };
        const newAiMessage: Message = {
          id,
          speaker: 'ai',
          text: textChunk,
          timestamp: newVersion.timestamp,
          modelAliasUsed: currentModelAliasRef.current,
          versions: [newVersion],
          activeVersion: 0,
          error: isError ? errorMessage : undefined,
        };
        return [...prev, newAiMessage];
      }

      return prev;
    });
  }, [defaultModelAlias]);

  const processAndSetStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    messageIdToUpdate: string,
    isRegeneration: boolean
    ) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let isFirstChunk = true;
    let lineBuffer = '';

    if (currentModelAlias === "ChatNPT 1.0 Think") {
      setThinkingSteps([]);
    }

    try {
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
            console.log("Stream reading aborted by user.");
            setMessages(prev => prev.map(m => m.id === messageIdToUpdate
                ? { ...m, error: "aborted", text: m.text || "Generation stopped." }
                : m
            ));
            break;
        }

        const { value, done } = await reader.read();
        if (done) {
            if (lineBuffer.startsWith('data:')) {
                const parsedChunks = parseStreamChunk(lineBuffer);
                 for (const chunk of parsedChunks) {
                    if (chunk.text) {
                        addOrUpdateAiMessage(messageIdToUpdate, chunk.text, isFirstChunk, false, undefined, isRegeneration);
                        if (isFirstChunk) isFirstChunk = false;
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

            if (sseMessageLine.startsWith('data:')) {
                const parsedStreamChunks = parseStreamChunk(sseMessageLine);
                for (const chunk of parsedStreamChunks) {
                    if (chunk.error) throw new Error(chunk.error);

                    if (chunk.text) {
                        if (currentModelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
                            setThinkingSteps(prev => [...prev, { id: chunk.id, text: chunk.text! }]);
                        } else {
                            addOrUpdateAiMessage(messageIdToUpdate, chunk.text, isFirstChunk, false, undefined, isRegeneration);
                            if (isFirstChunk) isFirstChunk = false;
                        }
                    }

                    if (chunk.isFinalChunk && isFirstChunk) {
                        addOrUpdateAiMessage(messageIdToUpdate, "", isFirstChunk, true, "AI response was empty.", isRegeneration);
                    }
                }
            }
        }
      }
    } catch (e: any) {
      console.error("Stream processing error:", e);
      const errorMessage = getFriendlyErrorMessage(e.message);
      addOrUpdateAiMessage(messageIdToUpdate, "", true, true, errorMessage, isRegeneration);
      setError("Error processing AI response: " + errorMessage);
    } finally {
      setIsLoading(false);
      if (reader) reader.releaseLock();
    }
  }, [currentModelAlias, addOrUpdateAiMessage]);

  const sendMessage = useCallback(async (prompt: string, userMessageAlreadyAdded: boolean = false, regeneratedMessageId?: string) => {
    const isRegeneration = !!regeneratedMessageId;
    let historyToSend: Message[];
    let promptForApi: string;
    let messageIdToUpdate: string;

    if (isRegeneration) {
        const regeneratedMsgIndex = messages.findIndex(m => m.id === regeneratedMessageId);
        if (regeneratedMsgIndex < 1 || messages[regeneratedMsgIndex - 1].speaker !== 'user') {
            setError("Cannot regenerate: No preceding user prompt found.");
            return;
        }
        historyToSend = messages.slice(0, regeneratedMsgIndex - 1);
        promptForApi = messages[regeneratedMsgIndex - 1].text;
        messageIdToUpdate = regeneratedMessageId;
    } else {
        if (!prompt.trim() || isLoading) return;
        
        let currentMessages = [...messages];
        if (!userMessageAlreadyAdded) {
            const newUserMessage: Message = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2,9),
                text: prompt,
                speaker: 'user',
                timestamp: Date.now(),
            };
            currentMessages.push(newUserMessage);
            setMessages(currentMessages);
        }
        historyToSend = currentMessages.slice(0, -1);
        promptForApi = prompt;
        messageIdToUpdate = Date.now().toString(36) + Math.random().toString(36).substring(2,9) + "-ai";
    }


    setIsLoading(true);
    setError(null);
    if (currentModelAlias === "ChatNPT 1.0 Think") {
        setThinkingSteps([]);
    }
    abortControllerRef.current = new AbortController();

    try {
        const apiHistory = historyToSend
            .filter(msg => !msg.error)
            .map(msg => ({
                role: msg.speaker === 'user' ? 'user' : ('assistant' as 'user' | 'assistant'),
                content: msg.versions && typeof msg.activeVersion === 'number' ? msg.versions[msg.activeVersion].text : msg.text,
            }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Internal-API-Token': process.env.NEXT_PUBLIC_INTERNAL_API_TOKEN || '',
        },
        body: JSON.stringify({
            prompt: promptForApi,
            history: apiHistory,
            modelAlias: currentModelAlias,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => `HTTP error! status: ${response.status}`);
        throw new Error(errorText);
      }
      
      await processAndSetStream(response.body, messageIdToUpdate, isRegeneration);

    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Error sending message:", e);
        const specificError = getFriendlyErrorMessage(e.message);
        setError(specificError);
        addOrUpdateAiMessage(messageIdToUpdate, "", true, true, specificError, isRegeneration);
      }
      setIsLoading(false);
    }
  }, [isLoading, messages, currentModelAlias, processAndSetStream, addOrUpdateAiMessage]);

  const handleRegenerate = useCallback((messageId: string) => {
    sendMessage("", false, messageId);
  }, [sendMessage]);

  const handleEditSubmit = useCallback((messageId: string, newText: string) => {
    if (isLoading) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].speaker !== 'user') {
        console.error("Cannot edit message: not found or not a user message.");
        return;
    }
    
    const historyBeforeEdit = messages.slice(0, messageIndex);
    
    const editedMessage: Message = {
        ...messages[messageIndex],
        text: newText,
        timestamp: Date.now(),
    };

    const newMessagesState = [...historyBeforeEdit, editedMessage];
    setMessages(newMessagesState);

    const promptForApi = newText;
    const historyForApi = historyBeforeEdit;
    
    const messageIdToUpdate = Date.now().toString(36) + Math.random().toString(36).substring(2,9) + "-ai-edited";
    
    setIsLoading(true);
    setError(null);
    if (currentModelAlias === "ChatNPT 1.0 Think") {
        setThinkingSteps([]);
    }
    abortControllerRef.current = new AbortController();

    const sendEditedRequest = async () => {
        try {
            const apiHistory = historyForApi
                .filter(msg => !msg.error)
                .map(msg => ({
                    role: msg.speaker === 'user' ? 'user' : ('assistant' as 'user' | 'assistant'),
                    content: msg.versions && typeof msg.activeVersion === 'number' ? msg.versions[msg.activeVersion].text : msg.text,
                }));
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Internal-API-Token': process.env.NEXT_PUBLIC_INTERNAL_API_TOKEN || '',
                },
                body: JSON.stringify({
                    prompt: promptForApi,
                    history: apiHistory,
                    modelAlias: currentModelAlias,
                }),
                signal: abortControllerRef.current?.signal,
            });

            if (!response.ok || !response.body) {
                const errorText = await response.text().catch(() => `HTTP error! status: ${response.status}`);
                throw new Error(errorText);
            }
            
            await processAndSetStream(response.body, messageIdToUpdate, false);

        } catch (e: any) {
            if (e.name !== 'AbortError') {
                const specificError = getFriendlyErrorMessage(e.message);
                setError(specificError);
                addOrUpdateAiMessage(messageIdToUpdate, "", true, true, specificError, false);
            }
            setIsLoading(false);
        }
    };
    
    sendEditedRequest();

  }, [messages, isLoading, currentModelAlias, addOrUpdateAiMessage, processAndSetStream]);


  const handleLike = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: m.feedback === 'liked' ? undefined : 'liked' } : m));
  }, []);

  const handleDislike = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: m.feedback === 'disliked' ? undefined : 'disliked' } : m));
  }, []);

  const handleNavigateVersion = useCallback((messageId: string, direction: 'prev' | 'next') => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.versions && typeof m.activeVersion !== 'undefined') {
        const newVersionIndex = direction === 'prev' ? m.activeVersion - 1 : m.activeVersion + 1;
        if (newVersionIndex >= 0 && newVersionIndex < m.versions.length) {
          const newActiveVersion = m.versions[newVersionIndex];
          return {
            ...m,
            activeVersion: newVersionIndex,
            text: newActiveVersion.text,
            modelAliasUsed: newActiveVersion.modelAliasUsed,
            timestamp: newActiveVersion.timestamp,
            error: undefined,
          };
        }
      }
      return m;
    }));
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Generation stop requested.");
    }
    setIsLoading(false);
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
    handleLike,
    handleDislike,
    handleNavigateVersion,
    handleRegenerate,
    handleEditSubmit,
  };
}