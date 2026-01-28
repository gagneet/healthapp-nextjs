import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  status: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
  offset: z.number().int().nonnegative().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view lab orders' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    })

    const orders = await prisma.labOrder.findMany({
      where: {
        patientId: patient.id,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        doctor: { include: { user: true, specialty: true } },
        results: { orderBy: { resultDate: 'desc' } },
      },
      orderBy: { orderDate: 'desc' },
      take: query.limit,
      skip: query.offset,
    })

    const response = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderedTests: order.orderedTests,
      orderDate: order.orderDate,
      expectedResultDate: order.expectedResultDate,
      resultsAvailable: order.resultsAvailable,
      criticalValues: order.criticalValues,
      doctor: order.doctor
        ? {
            name: `${order.doctor.user.firstName} ${order.doctor.user.lastName}`,
            specialty: order.doctor.specialty?.name || 'General',
          }
        : null,
      resultsCount: order.results.length,
    }))

    return NextResponse.json(formatApiSuccess(response, 'Lab orders retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
