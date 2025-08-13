import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/auth-helpers";
import { 
  acknowledgeEmergencyAlert, 
  resolveEmergencyAlert, 
  escalateEmergencyAlert,
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * PATCH /api/emergency-alerts/[id]
 * Acknowledge, resolve, or escalate an emergency alert
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(handleApiError({
        message: 'Alert ID is required'
      }), { status: 400 });
    }

    let result;
    const userId = user.id || user.userId;

    // Handle different action types
    switch (body.action) {
      case 'acknowledge':
        result = await acknowledgeEmergencyAlert(id, {
          acknowledgedBy: userId,
          acknowledgeNotes: body.notes || '',
        });
        break;

      case 'resolve':
        if (!body.resolutionNotes) {
          return NextResponse.json(handleApiError({
            message: 'Resolution notes are required when resolving an alert'
          }), { status: 400 });
        }
        result = await resolveEmergencyAlert(id, {
          resolvedBy: userId,
          resolutionNotes: body.resolutionNotes,
          resolutionAction: body.resolutionAction || 'MEDICAL_INTERVENTION',
        });
        break;

      case 'escalate':
        result = await escalateEmergencyAlert(id, {
          escalatedBy: userId,
          escalationReason: body.escalationReason || 'Medical review required',
          escalationLevel: body.escalationLevel || 'SUPERVISOR',
        });
        break;

      default:
        return NextResponse.json(handleApiError({
          message: 'Invalid action. Must be acknowledge, resolve, or escalate'
        }), { status: 400 });
    }

    return NextResponse.json(formatApiSuccess(result, `Emergency alert ${body.action}d successfully`));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}