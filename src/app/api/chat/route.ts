import { NextRequest, NextResponse } from 'next/server';

const MODEL_ALIASES: Record<string, string> = {
  "NPT 1.0": "deepseek-ai/DeepSeek-V3-0324",
  "NPT 1.0 Think": "deepseek-ai/DeepSeek-R1",
  "NPT 1.5": "deepseek-ai/DeepSeek-R1-0528",
};

const SYSTEM_PROMPT_CHATNPT = "You are ChatNPT, an advanced AI assistant created by the OpenGen project. You are helpful, creative, and friendly.";

export async function POST(request: NextRequest) {
  try {
    const { prompt, history = [], modelAlias = "NPT 1.0" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const actualModelId = MODEL_ALIASES[modelAlias] || MODEL_ALIASES["NPT 1.0"];
    const chutesApiToken = process.env.CHUTES_API_TOKEN;

    if (!chutesApiToken) {
      console.error("/api/chat: CHUTES_API_TOKEN is not set.");
      return NextResponse.json({ error: "Server configuration error: Missing API token." }, { status: 500 });
    }

    const messagesForChutes = [
      { role: "system", content: SYSTEM_PROMPT_CHATNPT },
      ...history.map((msg: any) => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role, 
          content: msg.content 
      })),
      { role: "user", content: prompt },
    ];

    const chuteRequestBody = {
      model: actualModelId,
      messages: messagesForChutes,
      stream: true,
      max_tokens: 10000,
      temperature: 0.7,
    };

    const chuteResponse = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chutesApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chuteRequestBody),
    });

    if (!chuteResponse.ok) {
      const errorBody = await chuteResponse.text();
      return NextResponse.json(
        { error: `Error from AI service: ${chuteResponse.statusText}`, details: errorBody },
        { status: chuteResponse.status }
      );
    }

    if (!chuteResponse.body) {
      return NextResponse.json({ error: "No response body from AI service." }, { status: 500 });
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = chuteResponse.body!.getReader();
        let buffer = '';

        function pushToController(line: string) {
            if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if(buffer.length > 0) {
                   pushToController(buffer);
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            let EOL_index;
            
            while ((EOL_index = buffer.indexOf('\n')) >= 0) {
                const line = buffer.substring(0, EOL_index).trim();
                buffer = buffer.substring(EOL_index + 1);
                if (line) {
                   pushToController(line);
                }
            }
          }
        } catch (error) {
          console.error("/api/chat: Error reading stream from Chutes AI:", error);
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      }
    });

    return new Response(readableStream, {
      headers: { 
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error("/api/chat: CATCH BLOCK:", error.message, error.stack);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}