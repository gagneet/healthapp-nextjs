import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']).optional(),
  limit: z.number().int().positive().max(50).default(20),
  offset: z.number().int().nonnegative().default(0),
})

const createSchema = z.object({
  providerId: z.string().uuid(),
  providerType: z.enum(['doctor', 'hsp']),
  subject: z.string().min(1).max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view conversations' }), { status: 403 })
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

    const conversations = await prisma.messageConversation.findMany({
      where: {
        patientId: patient.id,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    })

    const response = conversations.map((conversation) => {
      const lastMessage = conversation.messages[0]
      return {
        id: conversation.id,
        subject: conversation.subject,
        providerId: conversation.providerId,
        providerType: conversation.providerType,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderType: lastMessage.senderType,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : null,
      }
    })

    return NextResponse.json(formatApiSuccess(response, 'Conversations retrieved successfully'))
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
      return NextResponse.json(handleApiError({ message: 'Only patients can start conversations' }), { status: 403 })
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

    // Verify provider exists based on type
    let providerExists = false
    if (data.providerType === 'doctor') {
      const doctor = await prisma.doctor.findUnique({
        where: { id: data.providerId },
        select: { id: true }
      })
      providerExists = !!doctor
    } else if (data.providerType === 'hsp') {
      const hsp = await prisma.healthcareServiceProvider.findUnique({
        where: { id: data.providerId },
        select: { id: true }
      })
      providerExists = !!hsp
    }

    if (!providerExists) {
      return NextResponse.json(handleApiError({ message: 'Provider not found' }), { status: 404 })
    }

    const conversation = await prisma.messageConversation.create({
      data: {
        patientId: patient.id,
        providerId: data.providerId,
        providerType: data.providerType,
        subject: data.subject,
      },
    })

    return NextResponse.json(formatApiSuccess(conversation, 'Conversation created successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
