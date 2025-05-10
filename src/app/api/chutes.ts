async function invokeChute() {
    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer $CHUTES_API_TOKEN",
    "Content-Type": "application/json"
            },
            body: JSON.stringify(			{
      "model": "deepseek-ai/DeepSeek-R1",
      "messages": [
        {
          "role": "user",
          "content": "Tell me a 250 word story."
        }
      ],
      "stream": true,
      "max_tokens": 1024,
      "temperature": 0.7
    })
    });
    
    const data = await response.json();
    console.log(data);
}

invokeChute();