import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await request.json();
    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const dailyApiKey = process.env.DAILY_API_KEY;
    const dailyApiUrl = process.env.DAILY_API_URL || 'https://api.daily.co/v1';

    if (!dailyApiKey || dailyApiKey === 'YOUR_DAILY_API_KEY') {
      console.error('Daily.co API key is not configured.');
      // Return a mock token for development if no key is present
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ token: 'dev-mock-token' });
      }
      return NextResponse.json({ error: 'Video provider is not configured.' }, { status: 500 });
    }

    const response = await fetch(`${dailyApiUrl}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: session.user.name || 'Participant',
          userId: session.user.id,
          // Token expires in 1 hour
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Failed to get Daily.co meeting token:', response.status, errorBody);
      return NextResponse.json({ error: 'Failed to get meeting token' }, { status: 500 });
    }

    const { token } = await response.json();
    return NextResponse.json({ token });

  } catch (error) {
    console.error('Error getting meeting token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
