import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view lab results' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const order = await prisma.labOrder.findFirst({
      where: { id: params.id, patientId: patient.id },
      include: {
        doctor: { include: { user: true, specialty: true } },
        results: { orderBy: { resultDate: 'desc' } },
      },
    })

    if (!order) {
      return NextResponse.json(handleApiError({ message: 'Lab order not found' }), { status: 404 })
    }

    return NextResponse.json(formatApiSuccess(order, 'Lab order retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
