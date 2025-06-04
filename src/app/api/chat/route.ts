import { NextRequest, NextResponse } from 'next/server';

const MODEL_ALIASES: Record<string, string> = {
  "ChatNPT 1.0": "deepseek-ai/DeepSeek-V3-0324",
  "ChatNPT 1.0 Think": "deepseek-ai/DeepSeek-R1",
  "NPT 1.5": "deepseek-ai/DeepSeek-R1-0528",
};

const SYSTEM_PROMPT_CHATNPT = "You are ChatNPT, an advanced AI assistant. You are helpful, creative, and friendly. You were created by the OpenGen project.";

export async function POST(request: NextRequest) {
  console.log("/api/chat: Received request");
  try {
    const { prompt, history = [], modelAlias = "ChatNPT 1.0" } = await request.json();
    console.log("/api/chat: Parsed body:", { prompt, modelAlias, historyCount: history.length });

    if (!prompt) {
      console.error("/api/chat: Prompt is required");
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const actualModelId = MODEL_ALIASES[modelAlias] || MODEL_ALIASES["ChatNPT 1.0"];
    console.log("/api/chat: Using model ID:", actualModelId);

    const messagesForChutes = [
      { role: "system", content: SYSTEM_PROMPT_CHATNPT },
      ...history.map((msg: any) => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role, 
          content: msg.content 
      })),
      { role: "user", content: prompt },
    ];


    const chutesApiToken = process.env.CHUTES_API_TOKEN;
    if (!chutesApiToken) {
      console.error("/api/chat: CHUTES_API_TOKEN is not set.");
      return NextResponse.json({ error: "Server configuration error: Missing API token." }, { status: 500 });
    }

    const chuteRequestBody = {
      model: actualModelId,
      messages: messagesForChutes,
      stream: true,
      max_tokens: 10000,
      temperature: 0.7,
    };

    console.log("/api/chat: Sending to Chutes AI:", JSON.stringify(chuteRequestBody, null, 2));

    const chuteResponse = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chutesApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chuteRequestBody),
    });
    
    console.log("/api/chat: Chutes AI response status:", chuteResponse.status);

    if (!chuteResponse.ok) {
      const errorBody = await chuteResponse.text();
      console.error(`/api/chat: Chutes AI Error (${chuteResponse.status}): ${errorBody}`);
      return NextResponse.json(
        { error: `Error from AI service: ${chuteResponse.statusText}`, details: errorBody },
        { status: chuteResponse.status }
      );
    }

    if (!chuteResponse.body) {
      console.error("/api/chat: No response body from AI service.");
      return NextResponse.json({ error: "No response body from AI service." }, { status: 500 });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = chuteResponse.body!.getReader();
        const decoder = new TextDecoder();
        console.log("/api/chat: Starting to stream response to client.");
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("/api/chat: Stream from Chutes AI finished.");
              break;
            }
            const decodedChunk = decoder.decode(value);
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("/api/chat: Error reading stream from Chutes AI:", error);
          controller.error(error);
        } finally {
          console.log("/api/chat: Closing stream to client.");
          controller.close();
          reader.releaseLock();
        }
      }
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }, 
    });

  } catch (error: any) {
    console.error("/api/chat: CATCH BLOCK:", error.message, error.stack);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}