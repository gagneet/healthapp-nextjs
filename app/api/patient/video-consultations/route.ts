import { auth } from '@/lib/auth'
import VideoConsultationService from '@/lib/services/VideoConsultationService'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Only patients can view video consultations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userType: 'doctor' | 'patient' = 'patient'

    const result = status === 'active'
      ? await VideoConsultationService.getActiveConsultations(session.user.id, userType)
      : await VideoConsultationService.getConsultationHistory(session.user.id, userType, page, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: 500 })
    }

    const consultations = (result.consultations || []).map((consultation: any) => ({
      ...consultation,
      consultationType: consultation.consultationType ?? consultation.consultation_type ?? null,
      scheduledStart: consultation.scheduledStart ?? consultation.scheduled_start ?? null,
      scheduledEnd: consultation.scheduledEnd ?? consultation.scheduled_end ?? null,
    }))

    return NextResponse.json({
      status: 'success',
      data: consultations,
      pagination: result.pagination || undefined,
      message: 'Video consultations retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching video consultations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
