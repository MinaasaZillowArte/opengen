import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data || !data.history) {
      return NextResponse.json(
        { success: false, message: 'No history provided.' },
        { status: 400 }
      );
    }

    console.log('[IMPROVE API] Received chat history for model improvement:', {
        historyLength: data.history.length,
        firstMessage: data.history[0] || 'N/A',
        modelUsed: data.modelAlias || 'N/A'
    });


    return NextResponse.json(
        { success: true, message: 'Data received successfully.' },
        { status: 200 }
    );
  } catch (error: any) {
    console.error('[IMPROVE API] Error processing request:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}