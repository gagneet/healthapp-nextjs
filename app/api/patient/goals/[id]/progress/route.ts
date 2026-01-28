import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const progressSchema = z.object({
  value: z.number(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can update goals' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const goal = await prisma.healthGoal.findFirst({
      where: { id: params.id, patientId: patient.id },
    })

    if (!goal) {
      return NextResponse.json(handleApiError({ message: 'Goal not found' }), { status: 404 })
    }

    const body = await request.json()
    const data = progressSchema.parse(body)

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.goalProgressLog.create({
        data: {
          goalId: goal.id,
          value: data.value,
          notes: data.notes,
          loggedAt: new Date(),
        },
      })

      await tx.healthGoal.update({
        where: { id: goal.id },
        data: {
          currentValue: data.value,
          status: goal.targetValue && data.value >= goal.targetValue ? 'ACHIEVED' : goal.status,
          completedAt: goal.targetValue && data.value >= goal.targetValue ? new Date() : goal.completedAt,
          updatedAt: new Date(),
        },
      })

      return progress
    })

    return NextResponse.json(formatApiSuccess(result, 'Goal progress recorded successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
