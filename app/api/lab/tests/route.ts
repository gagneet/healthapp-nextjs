import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import LaboratoryService from '@/lib/services/LaboratoryService';




export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const result = await LaboratoryService.getLabTestCatalog(category || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.tests,
      meta: {
        totalTests: result.tests?.length || 0,
        category: category || 'all'
      },
      message: 'Lab test catalog retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching lab test catalog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
