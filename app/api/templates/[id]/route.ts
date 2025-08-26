import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/templates/{id}
 * Get a specific care plan template
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and HSPs can access templates
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only healthcare providers can access templates' } }
      }, { status: 403 });
    }

    const { id: templateId } = params;

    // Get template from database
    const template = await prisma.care_plan_templates.findUnique({
      where: { id: templateId },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        Organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Template not found' } }
      }, { status: 404 });
    }

    // Transform to expected format
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      type: template.template_type || 'care_plan',
      description: template.description,
      content: template.template_content,
      category: template.category,
      tags: Array.isArray(template.tags) ? template.tags : [],
      isActive: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at,
      usage_count: template.usage_count || 0,
      creator: template.User ? {
        name: `${template.User.first_name || ''} ${template.User.last_name || ''}`.trim(),
        email: template.User.email
      } : null,
      organization: template.Organization ? {
        id: template.Organization.id,
        name: template.Organization.name
      } : null
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: formattedTemplate,
        message: 'Template retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * PUT /api/templates/{id}
 * Update a care plan template
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can update templates
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can update templates' } }
      }, { status: 403 });
    }

    const { id: templateId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.template_content) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Name and template content are required' } }
      }, { status: 400 });
    }

    // Check if template exists and user has permission to update
    const existingTemplate = await prisma.care_plan_templates.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Template not found' } }
      }, { status: 404 });
    }

    // Update template
    const updatedTemplate = await prisma.care_plan_templates.update({
      where: { id: templateId },
      data: {
        name: body.name,
        description: body.description,
        template_content: body.template_content,
        category: body.category,
        tags: body.tags || [],
        is_active: body.is_active !== undefined ? body.is_active : true,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: updatedTemplate,
        message: 'Template updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/{id}
 * Delete a care plan template
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can delete templates
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can delete templates' } }
      }, { status: 403 });
    }

    const { id: templateId } = params;

    // Check if template exists
    const existingTemplate = await prisma.care_plan_templates.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Template not found' } }
      }, { status: 404 });
    }

    // Soft delete the template
    await prisma.care_plan_templates.update({
      where: { id: templateId },
      data: {
        is_active: false,
        deleted_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Template deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}