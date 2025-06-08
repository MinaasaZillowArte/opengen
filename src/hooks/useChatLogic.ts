import { useState, useCallback, useRef, Dispatch, SetStateAction, useEffect } from 'react';

export interface MessageVersion {
  text: string;
  modelAliasUsed: string;
  timestamp: number;
  thinkingSteps?: ThinkingStep[]; // add this line
}

export interface Message {
  id: string;
  text: string;
  speaker: 'user' | 'ai' | 'thinking'; // add 'thinking' as valid
  timestamp?: number;
  error?: string;
  modelAliasUsed?: string;
  versions?: MessageVersion[];
  activeVersion?: number;
  feedback?: 'liked' | 'disliked';
  thinkingSteps?: ThinkingStep[];
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
    }
    return errorText || "An unexpected error occurred.";
};

export function useChatLogic({
  initialMessages = [],
  defaultModelAlias = "NPT 1.0",
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
    isRegeneration: boolean = false,
    finalThinkingSteps?: ThinkingStep[],
  ) => {
    setMessages(prev => {
      const existingMsgIndex = prev.findIndex(msg => msg.id === id);
      if (existingMsgIndex !== -1) {
        const updatedMessages = [...prev];
        let oldMsg = updatedMessages[existingMsgIndex];
        if (isRegeneration && isFirstChunk) {
          const newVersion: MessageVersion = {
            text: textChunk,
            modelAliasUsed: currentModelAliasRef.current,
            timestamp: Date.now(),
            thinkingSteps: finalThinkingSteps,
          };
          // Do not touch previous versions' thinkingSteps
          const existingVersions = (oldMsg.versions && oldMsg.versions.map(v => ({ ...v }))) || [{ text: oldMsg.text, modelAliasUsed: oldMsg.modelAliasUsed || defaultModelAlias, timestamp: oldMsg.timestamp || Date.now(), thinkingSteps: oldMsg.thinkingSteps }];
          const newMsg: Message = {
            ...oldMsg,
            versions: [...existingVersions, newVersion],
            activeVersion: existingVersions.length,
            text: newVersion.text,
            modelAliasUsed: newVersion.modelAliasUsed,
            error: undefined,
            feedback: undefined,
            thinkingSteps: finalThinkingSteps,
          };
          updatedMessages[existingMsgIndex] = newMsg;
        } else {
          const newMsg = { ...oldMsg };
          const currentActiveVersionIdx = newMsg.activeVersion ?? (newMsg.versions ? newMsg.versions.length - 1 : 0);
          const newVersions = [...(newMsg.versions || [])];
          if (newVersions[currentActiveVersionIdx]) {
            const updatedVersion = { ...newVersions[currentActiveVersionIdx] };
            updatedVersion.text += textChunk;
            // Only update thinkingSteps for the current version
            if (finalThinkingSteps) updatedVersion.thinkingSteps = finalThinkingSteps;
            newVersions[currentActiveVersionIdx] = updatedVersion;
            newMsg.versions = newVersions;
          }
          newMsg.text += textChunk;
          if (isError) {
            newMsg.error = errorMessage;
          }
          if(finalThinkingSteps) {
            newMsg.thinkingSteps = finalThinkingSteps;
          }
          updatedMessages[existingMsgIndex] = newMsg;
        }
        return updatedMessages;
      } else if (isFirstChunk) {
        const newVersion: MessageVersion = {
          text: textChunk,
          modelAliasUsed: currentModelAliasRef.current,
          timestamp: Date.now(),
          thinkingSteps: finalThinkingSteps,
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
          thinkingSteps: finalThinkingSteps,
        };
        return [...prev, newAiMessage];
      }
      return prev;
    });
  }, [defaultModelAlias]);
  
  const addOrUpdateThinkingSteps = useCallback((textChunk: string, localAccumulator: ThinkingStep[]): ThinkingStep[] => {
      let updatedAccumulator = [...localAccumulator];
      if (updatedAccumulator.length === 0) {
          updatedAccumulator = [{ id: 'thinking-1', text: textChunk }];
      } else {
          const lastStepIndex = updatedAccumulator.length - 1;
          updatedAccumulator[lastStepIndex] = {
              ...updatedAccumulator[lastStepIndex],
              text: updatedAccumulator[lastStepIndex].text + textChunk,
          };
      }

      // Update the live thinking steps for UI display
      setThinkingSteps(updatedAccumulator);
      return updatedAccumulator;
  }, []);

  const processAndSetStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    messageIdToUpdate: string,
    isRegeneration: boolean
    ) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let isFirstChunk = true;
    let sseBuffer = '';
    let contentBuffer = '';
    let isThinking = false;
    let accumulatedThinkingSteps: ThinkingStep[] = [];
    
    const useReasoning = currentModelAliasRef.current.includes("Think") || currentModelAliasRef.current.includes("1.5");

    const thinkStartTag = '<think>';
    const thinkEndTag = '</think>';

    try {
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
            setMessages(prev => prev.map(m => m.id === messageIdToUpdate ? { ...m, error: "aborted", text: m.text || "Generation stopped." } : m));
            break;
        }

        const { value, done } = await reader.read();
        if (done) {
          if (accumulatedThinkingSteps.length > 0) {
            // Stream is done, save the accumulated thinking steps to the message
            addOrUpdateAiMessage(messageIdToUpdate, "", false, false, undefined, isRegeneration, accumulatedThinkingSteps);
            // --- Add permanent thinking message to chat history, right before the AI message ---
            setMessages(prev => {
              // Find the index of the AI message
              const aiIdx = prev.findIndex(m => m.id === messageIdToUpdate);
              if (aiIdx === -1) return prev;
              // Remove any previous thinking message for this AI message
              const filtered = prev.filter(m => !(m.speaker === 'thinking' && m.timestamp === prev[aiIdx].timestamp));
              // Insert thinking message right before the AI message
              return [
                ...filtered.slice(0, aiIdx),
                {
                  id: `thinking-${messageIdToUpdate}`,
                  text: '',
                  speaker: 'thinking',
                  thinkingSteps: accumulatedThinkingSteps,
                  timestamp: Date.now(),
                } as Message,
                ...filtered.slice(aiIdx)
              ];
            });
          }
          break;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for(const line of lines) {
            if (line.trim().startsWith('data: ')) {
                const jsonString = line.trim().substring(6);
                if (jsonString === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonString);
                    contentBuffer += parsed.choices?.[0]?.delta?.content || '';
                } catch (e) {
                    console.warn("Failed to parse stream JSON:", jsonString, e);
                }
            }
        }

        if (useReasoning) {
            while (true) {
                const startTagIndex = !isThinking ? contentBuffer.indexOf(thinkStartTag) : -1;
                const endTagIndex = isThinking ? contentBuffer.indexOf(thinkEndTag) : -1;

                if (!isThinking && startTagIndex !== -1) {
                    const normalPart = contentBuffer.substring(0, startTagIndex);
                    if (normalPart) {
                        addOrUpdateAiMessage(messageIdToUpdate, normalPart, isFirstChunk, false, undefined, isRegeneration);
                        if(isFirstChunk) isFirstChunk = false;
                    }
                    contentBuffer = contentBuffer.substring(startTagIndex + thinkStartTag.length);
                    isThinking = true;
                } else if (isThinking && endTagIndex !== -1) {
                    const thinkingPart = contentBuffer.substring(0, endTagIndex);
                    if (thinkingPart) {
                        accumulatedThinkingSteps = addOrUpdateThinkingSteps(thinkingPart, accumulatedThinkingSteps);
                    }
                    contentBuffer = contentBuffer.substring(endTagIndex + thinkEndTag.length);
                    isThinking = false;
                } else {
                    break; 
                }
            }
        }

        if (contentBuffer) {
            if (isThinking) {
                accumulatedThinkingSteps = addOrUpdateThinkingSteps(contentBuffer, accumulatedThinkingSteps);
            } else {
                addOrUpdateAiMessage(messageIdToUpdate, contentBuffer, isFirstChunk, false, undefined, isRegeneration);
                if(isFirstChunk) isFirstChunk = false;
            }
            contentBuffer = '';
        }
      }
    } catch (e: any) {
      console.error("Stream processing error:", e);
      const errorMessage = getFriendlyErrorMessage(e.message);
      addOrUpdateAiMessage(messageIdToUpdate, "", true, true, errorMessage, isRegeneration);
      setError("Error processing AI response: " + errorMessage);
    } finally {
      setIsLoading(false);
      setThinkingSteps([]); // Clear live thinking steps when done
      if (reader) reader.releaseLock();
    }
  }, [addOrUpdateAiMessage, addOrUpdateThinkingSteps]);
  
  const sendMessage = useCallback(async (prompt: string, userMessageAlreadyAdded: boolean = false, regeneratedMessageId?: string) => {
    setThinkingSteps([]); // Always clear live thinking steps on new request
    const isRegeneration = !!regeneratedMessageId;
    let historyToSend: Message[];
    let promptForApi: string;
    let messageIdToUpdate: string;

    if (isRegeneration) {
        const regeneratedMsgIndex = messages.findIndex(m => m.id === regeneratedMessageId);
        // Find the nearest preceding user message, skipping 'thinking' messages
        let userMsgIndex = regeneratedMsgIndex - 1;
        while (userMsgIndex >= 0 && messages[userMsgIndex].speaker !== 'user') {
            userMsgIndex--;
        }
        if (regeneratedMsgIndex < 1 || userMsgIndex < 0) {
            setError("Cannot regenerate: No preceding user prompt found.");
            return;
        }
        historyToSend = messages.slice(0, userMsgIndex);
        promptForApi = messages[userMsgIndex].text;
        messageIdToUpdate = regeneratedMessageId;

        // Hapus semua pesan 'thinking' yang terkait dengan AI message ini
        setMessages(prev =>
            prev
                .filter(msg => !(msg.speaker === 'thinking' && (msg.id === `thinking-${regeneratedMessageId}` || (msg.timestamp && messages[regeneratedMsgIndex]?.timestamp && msg.timestamp === messages[regeneratedMsgIndex].timestamp))))
                .map(msg =>
                    msg.id === regeneratedMessageId
                        // Only clear thinkingSteps for the new version, keep all previous versions' thinkingSteps
                        ? {
                            ...msg,
                            text: '',
                            error: undefined,
                            feedback: undefined,
                            thinkingSteps: undefined,
                            versions: msg.versions?.map((v, i) =>
                                i === ((msg.versions?.length ?? 1) - 1)
                                    ? { ...v, thinkingSteps: undefined } // Only clear the latest version's thinkingSteps
                                    : v
                            )
                        }
                        : msg
                )
        );

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
    setThinkingSteps([]); // Clear live thinking steps from any previous turn.
    const historyBeforeEdit = messages.slice(0, messageIndex);
    const editedMessage: Message = {
        ...messages[messageIndex],
        text: newText,
        timestamp: Date.now(),
    };
    // Remove all thinking messages after edit
    const newMessagesState = [...historyBeforeEdit, editedMessage, ...messages.slice(messageIndex + 1).filter(m => m.speaker !== 'thinking')];
    setMessages(newMessagesState);
    sendMessage(newText, true);
  }, [messages, isLoading, sendMessage]);

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
            thinkingSteps: newActiveVersion.thinkingSteps, // restore thinkingSteps for this version at top-level
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