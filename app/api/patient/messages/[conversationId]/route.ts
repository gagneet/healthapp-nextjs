import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const messageSchema = z.object({
  content: z.string().min(1),
})

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view messages' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const conversation = await prisma.messageConversation.findFirst({
      where: { id: params.conversationId, patientId: patient.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(handleApiError({ message: 'Conversation not found' }), { status: 404 })
    }

    return NextResponse.json(formatApiSuccess(conversation, 'Conversation retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can send messages' }), { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 })
    }

    const conversation = await prisma.messageConversation.findFirst({
      where: { id: params.conversationId, patientId: patient.id },
    })

    if (!conversation) {
      return NextResponse.json(handleApiError({ message: 'Conversation not found' }), { status: 404 })
    }

    const body = await request.json()
    const data = messageSchema.parse(body)

    const message = await prisma.patientMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        senderType: 'PATIENT',
        content: data.content,
      },
    })

    await prisma.messageConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json(formatApiSuccess(message, 'Message sent successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
