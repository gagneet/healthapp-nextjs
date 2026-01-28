import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatApiSuccess, handleApiError } from '@/lib/api-services'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  limit: z.number().int().positive().max(50).default(20),
  offset: z.number().int().nonnegative().default(0),
  category: z.string().optional(),
  contentType: z.enum(['ARTICLE', 'VIDEO', 'INFOGRAPHIC', 'FAQ', 'GUIDE']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view education content' }), { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      category: searchParams.get('category') || undefined,
      contentType: searchParams.get('contentType') || undefined,
    })

    const content = await prisma.educationalContent.findMany({
      where: {
        isPublished: true,
        ...(query.category ? { category: query.category } : {}),
        ...(query.contentType ? { contentType: query.contentType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    })

    return NextResponse.json(formatApiSuccess(content, 'Educational content retrieved successfully'))
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
