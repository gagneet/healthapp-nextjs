import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling,
} from "@/lib/api-response";

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string, dietPlanId: string } }
) => {
    const session = await auth();
    if (!session) {
        return createUnauthorizedResponse();
    }

    if (session.user.role !== "DOCTOR") {
        return createForbiddenResponse("Only doctors can remove diet plans");
    }

    const { carePlanId, dietPlanId } = params;

    const carePlan = await prisma.carePlan.findUnique({
        where: { id: carePlanId },
    });

    if (!carePlan) {
        return createErrorResponse({ message: "Care plan not found" }, 404);
    }

    if (carePlan.createdByDoctorId !== session.user.profileId) {
        return createForbiddenResponse();
    }

    await prisma.carePlanToDietPlan.delete({
        where: {
            carePlanId_dietPlanId: {
                carePlanId,
                dietPlanId,
            }
        },
    });

    return createSuccessResponse({}, 204);
});
