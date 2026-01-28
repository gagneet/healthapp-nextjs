import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  caregiverId: z.string().uuid(),
  relationship: z.string().min(1),
  accessLevel: z.enum(['VIEW_ONLY', 'VIEW_AND_LOG', 'FULL_ACCESS']).default('VIEW_ONLY'),
  expiresAt: z.string().datetime().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view caregivers' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const caregivers = await prisma.caregiverAccess.findMany({
      where: { patientId: patient.id },
      include: { caregiver: { select: { id: true, name: true, email: true } } },
      orderBy: { invitedAt: 'desc' },
    })

    return NextResponse.json(formatApiSuccess(caregivers, 'Caregivers retrieved successfully'))
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
      return NextResponse.json(handleApiError({ message: 'Only patients can add caregivers' }), { status: 403 })
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

    const caregiver = await prisma.caregiverAccess.upsert({
      where: { patientId_caregiverId: { patientId: patient.id, caregiverId: data.caregiverId } },
      update: {
        relationship: data.relationship,
        accessLevel: data.accessLevel,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: 'ACTIVE',
      },
      create: {
        patientId: patient.id,
        caregiverId: data.caregiverId,
        relationship: data.relationship,
        accessLevel: data.accessLevel,
        permissions: {},
        invitedAt: new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(formatApiSuccess(caregiver, 'Caregiver added successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
