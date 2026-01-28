import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  category: z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_SUGAR', 'EXERCISE', 'NUTRITION', 'MEDICATION_ADHERENCE', 'SLEEP', 'STRESS', 'CUSTOM']),
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  targetDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view goals' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const goals = await prisma.healthGoal.findMany({
      where: { patientId: patient.id },
      include: {
        milestones: true,
        progressLogs: { orderBy: { loggedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(formatApiSuccess(goals, 'Goals retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can create goals' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const goal = await prisma.healthGoal.create({
      data: {
        patientId: patient.id,
        category: data.category,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        unit: data.unit,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        startDate: new Date(),
        status: 'IN_PROGRESS',
        isPatientCreated: true,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(formatApiSuccess(goal, 'Goal created successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
