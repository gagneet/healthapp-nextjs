import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

// In-memory store for lab integration configurations.
// In a real application, this should be stored in a secure, encrypted database.

export const dynamic = 'force-dynamic';

const labIntegrations = [
  {
    id: 'quest',
    name: 'Quest Diagnostics',
    apiKey: process.env.QUEST_API_KEY,
    apiUrl: 'https://api.questdiagnostics.com/v1',
  },
  {
    id: 'labcorp',
    name: 'LabCorp',
    apiKey: process.env.LABCORP_API_KEY,
    apiUrl: 'https://api.labcorp.com/v1',
  },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(labIntegrations.map(({ apiKey, ...rest }) => rest));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, apiKey, apiUrl } = body;

    if (!id || !name || !apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, you would encrypt and store the API key securely.
    // For this example, we just add it to our in-memory array.
    labIntegrations.push({ id, name, apiKey, apiUrl });

    return NextResponse.json({ message: 'Lab integration added successfully' });
  } catch (error) {
    console.error('Error adding lab integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
