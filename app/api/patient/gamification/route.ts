import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view gamification data' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const [profile, badges, challenges] = await Promise.all([
      prisma.patientGameProfile.findUnique({ where: { patientId: patient.id } }),
      prisma.gameBadgeAward.findMany({ where: { patientId: patient.id }, orderBy: { awardedDate: 'desc' } }),
      prisma.gameChallengeProgress.findMany({ where: { patientId: patient.id }, orderBy: { endDate: 'desc' } }),
    ])

    return NextResponse.json(formatApiSuccess({ profile, badges, challenges }, 'Gamification data retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
