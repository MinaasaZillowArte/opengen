export interface StreamChunk {
    id: string;
    text?: string;
    isReasoningStep?: boolean;
    isFinalChunk?: boolean;
    error?: string;
  }
  
  // This parser needs to be robust and adapt to the actual Chutes AI stream format.
  // The example from chutes.ts doesn't show streaming format, only a final JSON.
  // We'll assume a Server-Sent Events (SSE) like structure for streaming.
  export function parseStreamChunk(chunk: string): StreamChunk[] {
    const chunks: StreamChunk[] = [];
    // SSE data can have multiple "data: " lines per chunk
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
  
    for (const line of lines) {
      const jsonString = line.substring('data: '.length).trim();
      if (jsonString === '[DONE]') {
        chunks.push({ id: 'done', isFinalChunk: true });
        continue;
      }
  
      try {
        const parsed = JSON.parse(jsonString);
        const delta = parsed.choices?.[0]?.delta;
  
        if (delta?.content) {
          let content = delta.content as string;
          let isReasoning = false;
  
          // Hypothetical markers for reasoning steps (ADJUST BASED ON ACTUAL API)
          const reasoningPrefix = "[REASONING_STEP]";
          if (content.startsWith(reasoningPrefix)) {
            isReasoning = true;
            content = content.substring(reasoningPrefix.length).trimStart();
          }
          
          // Another hypothetical marker for end of reasoning if Chutes sends it explicitly
          const endReasoningMarker = "[END_REASONING]";
          if (content.includes(endReasoningMarker)) {
              // Handle potential content before the marker
              const parts = content.split(endReasoningMarker);
              if (parts[0].trim()) {
                   chunks.push({
                      id: parsed.id || Date.now().toString() + Math.random(),
                      text: parts[0].trim(),
                      isReasoningStep: isReasoning, // Might be true if prefix was also present
                  });
              }
              // The rest of the content is part of the main answer
              content = parts[1] || "";
              isReasoning = false; // Reset reasoning flag
          }
  
  
          if (content) { // Only push if there's actual content
            chunks.push({
              id: parsed.id || Date.now().toString() + Math.random(),
              text: content,
              isReasoningStep: isReasoning,
              isFinalChunk: parsed.choices?.[0]?.finish_reason !== null,
            });
          } else if (parsed.choices?.[0]?.finish_reason !== null) {
            // Handle cases where only finish_reason is sent
             chunks.push({
              id: parsed.id || Date.now().toString() + Math.random(),
              isFinalChunk: true,
            });
          }
        } else if (parsed.choices?.[0]?.finish_reason !== null) {
          // Handle cases where only finish_reason is sent without content in delta
          chunks.push({
            id: parsed.id || Date.now().toString() + Math.random(),
            isFinalChunk: true,
          });
        }
        // Potentially handle other types of messages or metadata from the stream if needed
      } catch (error) {
        console.warn("Failed to parse stream chunk:", jsonString, error);
        // Optionally, push an error object or ignore malformed chunks
        // chunks.push({ id: 'error-' + Date.now(), error: "Malformed stream data" });
      }
    }
    return chunks;
  }
  
  // Example of how you might accumulate reasoning steps and final answer
  export interface ProcessedStreamResult {
    reasoningSteps: string[];
    finalAnswer: string;
    isComplete: boolean;
    error?: string;
  }
  
  export function processStream(
    existingResult: ProcessedStreamResult,
    rawChunk: string,
    modelAlias: string
  ): ProcessedStreamResult {
    const newResult = { ...existingResult, reasoningSteps: [...existingResult.reasoningSteps] };
    const parsedChunks = parseStreamChunk(rawChunk);
  
    for (const chunk of parsedChunks) {
      if (chunk.error) {
        newResult.error = chunk.error;
        newResult.isComplete = true; // Stop processing on error
        break;
      }
      if (chunk.isFinalChunk) {
        newResult.isComplete = true;
      }
      if (chunk.text) {
        if (modelAlias === "ChatNPT 1.0 Think" && chunk.isReasoningStep) {
          // For "Think" model, accumulate reasoning steps.
          // This might need more sophisticated logic if steps are multi-chunk.
          newResult.reasoningSteps.push(chunk.text);
        } else {
          newResult.finalAnswer += chunk.text;
        }
      }
    }
    return newResult;
  }