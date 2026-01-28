import { auth } from '@/lib/auth'
import VideoConsultationService from '@/lib/services/VideoConsultationService'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Only patients can join consultations' }, { status: 403 })
    }

    const result = await VideoConsultationService.joinConsultation({
      consultationId: params.id,
      userId: session.user.id,
      userType: 'patient',
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({
      status: 'success',
      data: {
        joinUrl: result.joinUrl,
        roomId: result.roomId,
        consultation: result.consultation,
      },
      message: 'Successfully joined video consultation',
    })
  } catch (error) {
    console.error('Error joining video consultation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
