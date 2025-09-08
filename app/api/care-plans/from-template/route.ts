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

const createFromTemplateSchema = z.object({
  templateId: z.string().uuid(),
  patientId: z.string().uuid(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== "DOCTOR") {
    return createForbiddenResponse("Only doctors can create care plans");
  }

  const body = await request.json();
  const validationResult = createFromTemplateSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { templateId, patientId } = validationResult.data;

  // Fetch the template
  const template = await prisma.carePlanTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return createErrorResponse({ message: "Template not found" }, 404);
  }

  // Fetch the patient
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    return createErrorResponse({ message: "Patient not found" }, 404);
  }

  const doctorId = session.user.profileId;
  if (!doctorId) {
    return createErrorResponse(
      { message: "Doctor profile not found for the current user" },
      400
    );
  }

  // Create a new CarePlan from the template data
  // The templateData is a JSON field, so we need to cast it
  const templateData = template.templateData as any;

  const carePlan = await prisma.carePlan.create({
    data: {
      patient: {
        connect: { id: patientId },
      },
      doctor: {
        connect: { id: doctorId },
      },
      title: template.name,
      description: template.description,
      startDate: new Date(),
      // You can add more fields from the template here
      // For example, if the template has a duration, you can calculate the end date
      status: "ACTIVE",
      priority: "MEDIUM",
      details: templateData, // Copy the template data into the details field
    },
  });

  return createSuccessResponse(carePlan, 201);
});
