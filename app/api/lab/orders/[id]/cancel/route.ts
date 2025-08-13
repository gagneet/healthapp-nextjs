import { NextRequest, NextResponse } from 'next/server';
import LaboratoryService from '@/lib/services/LaboratoryService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';



export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );

    // Only doctors can cancel lab orders
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can cancel lab orders' },
        { status: 403 }
      );

    const orderId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );

    const result = await LaboratoryService.cancelLabOrder(orderId, session.user.id, reason);

    if (!result.success) {
      const statusCode = result.error?.includes('Access denied') || result.error?.includes('Only the ordering') ? 403 : 400;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: statusCode }
      );

    return NextResponse.json({
      status: 'success',
      data: result.order,
      message: result.message
    });

  } catch (error) {
    console.error('Error cancelling lab order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}