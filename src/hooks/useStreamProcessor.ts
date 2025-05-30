import { useState, useCallback } from 'react';
import { StreamChunk, parseStreamChunk } from '@/utils/streamParser';

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

  const resetProcessor = useCallback(() => {
    setProcessedState({
      reasoningSteps: [],
      finalAnswer: '',
      isComplete: false,
      error: undefined,
    });
  }, []);

  const processChunk = useCallback((rawChunk: string) => {
    setProcessedState(prevState => {
      const newState = { ...prevState, reasoningSteps: [...prevState.reasoningSteps] };
      const parsedChunks = parseStreamChunk(rawChunk); // From your utility

      for (const chunk of parsedChunks) {
        if (chunk.error) {
          newState.error = chunk.error;
          newState.isComplete = true;
          break;
        }
        if (chunk.isFinalChunk) {
          newState.isComplete = true;
        }
        if (chunk.text) {
          if (modelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
            newState.reasoningSteps.push(chunk.text);
          } else {
            newState.finalAnswer += chunk.text;
          }
        }
      }
      return newState;
    });
  }, [modelAlias]);

  return {
    processedState,
    processChunk,
    resetProcessor,
  };
}