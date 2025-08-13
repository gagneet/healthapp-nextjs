import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/auth-helpers';
import { 
  getEmergencyAlerts, 
  createEmergencyAlert, 
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * GET /api/emergency-alerts
 * Retrieve emergency alerts with filtering
 * Query params: patientId, alertType, severity, status, resolved, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { searchParams } = new URL(request.url);
    const queryParameters = {
      patientId: searchParams.get('patientId') || undefined,
      alertType: searchParams.get('alertType') || '',
      severity: searchParams.get('severity') || '',
      status: searchParams.get('status') || '',
      resolved: searchParams.get('resolved') === 'true' ? true : 
                searchParams.get('resolved') === 'false' ? false : undefined,
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const alerts = await getEmergencyAlerts(queryParameters);
    
    return NextResponse.json(formatApiSuccess(alerts, 'Emergency alerts retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/emergency-alerts
 * Create a new emergency alert
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - Only healthcare providers can create alerts
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const alertData = await request.json();

    // Required field validation
    if (!alertData.patientId || !alertData.alertType || !alertData.severity) {
      return NextResponse.json(handleApiError({
        message: 'Patient ID, alert type, and severity are required'
      }), { status: 400 });
    }

    // Add creation metadata
    alertData.createdBy = user.id || user.userId;
    alertData.triggeredAt = new Date().toISOString();

    const newAlert = await createEmergencyAlert(alertData);
    
    return NextResponse.json(formatApiSuccess(newAlert, 'Emergency alert created successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}