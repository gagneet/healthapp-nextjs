import { NextRequest, NextResponse } from 'next/server';
import LaboratoryService from '@/lib/services/LaboratoryService';
import { z } from 'zod';

const labResultSchema = z.object({
  orderId: z.string().uuid(),
  testResults: z.array(z.object({
    testCode: z.string(),
    testName: z.string(),
    result: z.string(),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
    status: z.enum(['normal', 'abnormal', 'critical', 'pending']),
    flag: z.enum(['high', 'low', 'critical_high', 'critical_low']).optional(),
    notes: z.string().optional(),
  })),
  labId: z.string().optional(),
  collectedAt: z.string().datetime().optional(),
  processedAt: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // In a production environment, you would want to secure this webhook endpoint.
  // This could be done by checking for a secret token in the headers,
  // or by verifying the IP address of the incoming request.
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.LAB_WEBHOOK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = labResultSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    // Convert date strings to Date objects
    const processedData = {
      ...validation.data,
      collectedAt: validation.data.collectedAt ? new Date(validation.data.collectedAt) : undefined,
      processedAt: validation.data.processedAt ? new Date(validation.data.processedAt) : undefined,
    };
    
    const result = await LaboratoryService.processLabResults(processedData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Lab results processed successfully' });
  } catch (error) {
    console.error('Error processing lab results webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
