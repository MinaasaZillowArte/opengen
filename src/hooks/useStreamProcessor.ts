import { useState, useCallback, useEffect } from 'react';

export interface ProcessedStreamState {
  reasoningSteps: string[];
  finalAnswer: string;
  isComplete: boolean;
  error?: string;
}

export function useStreamProcessor(modelAlias: string) {
  const [processedState, setProcessedState] = useState<ProcessedStreamState>({
    reasoningSteps: [],
    finalAnswer: '',
    isComplete: false,
  });
  const [isThinking, setIsThinking] = useState(false);
  const [buffer, setBuffer] = useState('');

  const resetProcessor = useCallback(() => {
    setProcessedState({
      reasoningSteps: [],
      finalAnswer: '',
      isComplete: false,
      error: undefined,
    });
    setIsThinking(false);
    setBuffer('');
  }, []);

  const processChunk = useCallback((rawChunk: string) => {
    setBuffer(prev => prev + rawChunk);
  }, []);

  useEffect(() => {
    if (!buffer) return;

    let tempBuffer = buffer;
    let finalAnswerUpdate = '';
    let reasoningUpdate: string[] = [];
    let thinkTagOpened = isThinking;

    const thinkStartTag = '<think>';
    const thinkEndTag = '</think>';

    let startIndex = tempBuffer.indexOf(thinkStartTag);
    while (startIndex !== -1) {
      if (!thinkTagOpened) {
        finalAnswerUpdate += tempBuffer.substring(0, startIndex);
      }
      
      let endIndex = tempBuffer.indexOf(thinkEndTag, startIndex);
      
      if (endIndex !== -1) {
        const reasoning = tempBuffer.substring(startIndex + thinkStartTag.length, endIndex).trim();
        if (reasoning) {
          reasoningUpdate.push(reasoning);
        }
        tempBuffer = tempBuffer.substring(endIndex + thinkEndTag.length);
        thinkTagOpened = false;
      } else {
        const reasoning = tempBuffer.substring(startIndex + thinkStartTag.length).trim();
        if (reasoning) {
          reasoningUpdate.push(reasoning);
        }
        tempBuffer = '';
        thinkTagOpened = true;
      }
      startIndex = tempBuffer.indexOf(thinkStartTag);
    }
    
    if (!thinkTagOpened && tempBuffer.length > 0) {
      finalAnswerUpdate += tempBuffer;
      tempBuffer = '';
    }

    if (finalAnswerUpdate.length > 0 || reasoningUpdate.length > 0) {
       setProcessedState(prev => ({
        ...prev,
        finalAnswer: prev.finalAnswer + finalAnswerUpdate,
        reasoningSteps: [...prev.reasoningSteps, ...reasoningUpdate]
      }));
    }

    setBuffer(tempBuffer);
    setIsThinking(thinkTagOpened);
    
  }, [buffer, isThinking]);
  
  const markAsComplete = useCallback(() => {
      setProcessedState(prev => ({ ...prev, isComplete: true }));
  }, []);

  return {
    processedState,
    processChunk,
    resetProcessor,
    markAsComplete,
  };
}