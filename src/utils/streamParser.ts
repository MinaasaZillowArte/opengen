export interface StreamChunk {
  id: string;
  text?: string;
  isReasoningStep?: boolean;
  isFinalChunk?: boolean;
  error?: string;
}

export function parseStreamChunk(chunk: string): StreamChunk[] {
  const chunks: StreamChunk[] = [];
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

      if (!delta) continue;

      const newChunkBase = {
        id: parsed.id || Date.now().toString() + Math.random(),
        isFinalChunk: parsed.choices?.[0]?.finish_reason !== null,
      };

      if (delta.reasoning_content) {
        chunks.push({
          ...newChunkBase,
          text: delta.reasoning_content,
          isReasoningStep: true,
        });
      }
      
      if (delta.content) {
        chunks.push({
          ...newChunkBase,
          text: delta.content,
          isReasoningStep: false,
        });
      }

    } catch (error) {
      console.warn("Gagal mem-parsing stream chunk:", jsonString, error);
    }
  }

  return chunks;
}