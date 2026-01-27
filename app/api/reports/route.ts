import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {

  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { z } from "zod";


export const dynamic = 'force-dynamic';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const getReportsSchema = z.object({
  patientId: z.string().uuid(),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const validation = getReportsSchema.safeParse({
    patientId: searchParams.get('patientId'),
  });

  if (!validation.success) {
    return createErrorResponse(new Error("Invalid patientId"), 400);
  }

  const { patientId } = validation.data;

  // Fetch the patient to check for authorization
  const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { primaryCareDoctorId: true }
  });

  if (!patient) {
      return createErrorResponse(new Error("Patient not found"), 404);
  }

  const isPrimaryDoctor = patient.primaryCareDoctorId === session.user.profileId;
  const isAdmin = session.user.role === 'SYSTEM_ADMIN';

  if (!isPrimaryDoctor && !isAdmin) {
      return createForbiddenResponse();
  }

  const reports = await prisma.report.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });

  return createSuccessResponse(reports);
});


export const POST = withErrorHandling(async (request: NextRequest) => {
    const session = await auth();
    if (!session) {
        return createUnauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string;
    const carePlanId = formData.get("carePlanId") as string | undefined;

    if (!file) {
        return createErrorResponse(new Error("File is required"));
    }
    if (!patientId) {
        return createErrorResponse(new Error("patientId is required"));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    const report = await prisma.report.create({
        data: {
            patientId,
            carePlanId,
            name: file.name,
            url,
        },
    });

    return createSuccessResponse(report, 201);
});
