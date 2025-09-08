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

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
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
        return createErrorResponse({ message: "File is required" }, 400);
    }
    if (!patientId) {
        return createErrorResponse({ message: "patientId is required" }, 400);
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
