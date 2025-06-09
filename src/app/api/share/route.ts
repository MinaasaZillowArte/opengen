import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { ChatSession } from '@/types/chat';

const generateShareId = () => {
    return Math.random().toString(36).substring(2, 12);
};

export async function POST(request: NextRequest) {
    try {
        const chatSession: ChatSession = await request.json();

        if (!chatSession || !chatSession.messages || chatSession.messages.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid chat session provided.' }, { status: 400 });
        }

        const shareId = generateShareId();
        const chatDataString = JSON.stringify(chatSession);
        const createdAt = new Date().toISOString();
        const originalSessionId = chatSession.id;

        await turso.execute({
            sql: "INSERT INTO shared_chats (id, chat_data, created_at, original_session_id) VALUES (?, ?, ?, ?)",
            args: [shareId, chatDataString, createdAt, originalSessionId]
        });

        console.log(`[SHARE API] Chat session with ID ${originalSessionId} stored in Turso with shareId: ${shareId}`);
        
        return NextResponse.json({ success: true, shareId: shareId }, { status: 200 });

    } catch (error: any) {
        console.error('[SHARE API] Error creating share link:', error);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Internal Server Error', error: error.message }),
            { status: 500, headers: { 'content-type': 'application/json' } }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shareId = searchParams.get('id');

        if (!shareId) {
            return NextResponse.json({ success: false, message: 'Share ID is required.' }, { status: 400 });
        }

        const result = await turso.execute({
            sql: "SELECT chat_data FROM shared_chats WHERE id = ?",
            args: [shareId]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Chat not found.' }, { status: 404 });
        }

        const chatDataString = result.rows[0]['chat_data'] as string;
        const chatSession = JSON.parse(chatDataString);
        
        console.log(`[SHARE API] Retrieving shared chat with shareId: ${shareId}`);
        return NextResponse.json({ success: true, chatSession: chatSession }, { status: 200 });

    } catch (error: any) {
        console.error('[SHARE API] Error retrieving shared chat:', error);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Internal Server Error', error: error.message }),
            { status: 500, headers: { 'content-type': 'application/json' } }
        );
    }
}