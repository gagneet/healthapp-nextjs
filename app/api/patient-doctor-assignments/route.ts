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
import { z } from "zod";


export const dynamic = 'force-dynamic';

const createPatientDoctorAssignmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  assignmentType: z.string().optional().default("SPECIALIST"),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== "HSP" && session.user.role !== "SYSTEM_ADMIN") {
    return createForbiddenResponse("Only HSPs or Admins can assign doctors");
  }

  const body = await request.json();
  const validationResult = createPatientDoctorAssignmentSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { patientId, doctorId, assignmentType } = validationResult.data;

  const assignment = await prisma.patientDoctorAssignment.create({
      data: {
          patientId,
          doctorId,
          assignmentType,
          assignedByAdminId: session.user.id,
      }
  });

  return createSuccessResponse(assignment, 201);
});
