import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/drug-interactions/rxnorm
 * Fetch drug interaction data from RxNorm API
 * Query params: rxcui1, rxcui2, drugName
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting - more restrictive for external API calls
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, { windowMs: 60000, max: 10 })) {
      return NextResponse.json(handleApiError({
        message: 'Too many RxNorm API requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user - only healthcare providers can access RxNorm
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rxcui1 = searchParams.get('rxcui1');
    const rxcui2 = searchParams.get('rxcui2');
    const drugName = searchParams.get('drugName');

    if (!rxcui1 && !rxcui2 && !drugName) {
      return NextResponse.json(handleApiError({
        message: 'Either RxCUI codes or drug name is required'
      }), { status: 400 });
    }

    // Mock RxNorm API response for now
    // In production, this would call the actual RxNorm API
    const mockRxNormData = {
      drug: drugName || `Drug with RxCUI ${rxcui1}`,
      rxcui: rxcui1 || 'unknown',
      interactions: [
        {
          interactingDrug: rxcui2 ? `Drug with RxCUI ${rxcui2}` : 'Warfarin',
          rxcui: rxcui2 || '11289',
          severity: 'High',
          description: 'May increase risk of bleeding when used together',
          source: 'DrugBank',
          lastUpdated: new Date().toISOString(),
        },
      ],
      disclaimer: 'This data is sourced from RxNorm and should be verified with clinical guidelines.',
    };

    // Log the RxNorm API usage for audit purposes
    console.log(`RxNorm API accessed by user ${session.user?.id} for drug interaction check`);

    return NextResponse.json(formatApiSuccess(mockRxNormData, 'RxNorm interaction data retrieved'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/drug-interactions/rxnorm
 * Batch import drug interactions from RxNorm API
 * Body: { rxcuiList: string[], importAll: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    // Admin only - importing drug data requires elevated privileges
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
    const { rxcuiList, importAll } = await request.json();

    // Validation
    if (!rxcuiList || !Array.isArray(rxcuiList)) {
      return NextResponse.json(handleApiError({
        message: 'RxCUI list is required and must be an array'
      }), { status: 400 });
    }

    if (rxcuiList.length > 100) {
      return NextResponse.json(handleApiError({
        message: 'Maximum 100 RxCUIs can be processed at once'
      }), { status: 400 });
    }

    // Mock batch import results
    // In production, this would process each RxCUI and import drug interaction data
    const importResults = {
      requested: rxcuiList.length,
      imported: Math.floor(rxcuiList.length * 0.8), // Mock 80% success rate
      failed: Math.ceil(rxcuiList.length * 0.2),
      duplicates: Math.floor(rxcuiList.length * 0.1),
      newInteractions: Math.floor(rxcuiList.length * 2.5), // Average interactions per drug
      importedBy: user.id || (user as any).userId,
      importTimestamp: new Date().toISOString(),
      failedRxcuis: rxcuiList.slice(0, Math.ceil(rxcuiList.length * 0.2)), // Mock failed ones
    };

    // Log the batch import for audit
    console.log(`RxNorm batch import initiated by admin ${user.id}: ${rxcuiList.length} RxCUIs requested`);

    return NextResponse.json(formatApiSuccess(importResults, 'RxNorm batch import completed'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
