import { NextRequest, NextResponse } from 'next/server';
import LaboratoryService from '@/lib/services/LaboratoryService';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const testCode = searchParams.get('testCode');

  if (!patientId || !testCode) {
    return NextResponse.json({ error: 'patientId and testCode are required' }, { status: 400 });
  }

  // In a real application, you would add more robust authorization checks here.
  // For example, a doctor should only be able to view their own patients' data.
  // A patient should only be able to view their own data.
  // For now, we'll just check if the user is authenticated.

  try {
    const result = await LaboratoryService.getLabTrendAnalysis(patientId, testCode);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching lab trend analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
