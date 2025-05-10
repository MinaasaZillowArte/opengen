// File: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const CHUTES_AI_ENDPOINT = "https://llm.chutes.ai/v1/chat/completions";
const API_KEY = process.env.CHUTES_API_TOKEN;

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
    }

    try {
        const requestBody = await req.json(); // { model, messages, stream, max_tokens, temperature }

        // Ini adalah permintaan ke Chutes AI dari server Anda
        const response = await fetch(CHUTES_AI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(requestBody),
            // Penting untuk streaming: Next.js mungkin memiliki batas waktu default,
            // pastikan konfigurasi server Anda (Vercel, Node.js) mengizinkan koneksi long-lived.
            // Untuk Vercel, streaming didukung secara native pada fungsi Pro.
            // Jika menggunakan server Node.js sendiri, tidak ada masalah.
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Chutes AI API Error:", response.status, errorBody);
            return NextResponse.json(
                { error: "Error from upstream API", details: errorBody },
                { status: response.status }
            );
        }

        // Jika permintaan adalah untuk streaming
        if (requestBody.stream && response.body) {
            // Langsung return stream dari Chutes AI ke client
            return new Response(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            // Jika bukan streaming, parse JSON dan kirim
            const data = await response.json();
            return NextResponse.json(data);
        }

    } catch (error: any) {
        console.error("Proxy API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message || String(error) }, { status: 500 });
    }
}

// Opsional: Tambahkan ini agar Vercel (atau platform lain) tidak meng-cache response secara agresif
export const dynamic = 'force-dynamic';