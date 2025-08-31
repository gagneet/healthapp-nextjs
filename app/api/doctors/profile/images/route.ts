import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"
import { writeFile } from 'fs/promises'
import { join } from 'path'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()

  if (!session) {
    return createUnauthorizedResponse()
  }

  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can upload images")
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get('profile_image') as unknown as File;

    if (!file) {
      return createErrorResponse(new Error("No file uploaded"), 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicDir = join(process.cwd(), 'public', 'uploads', 'doctors');
    const filePath = join(publicDir, file.name);

    // Ensure directory exists
    await require('fs').promises.mkdir(publicDir, { recursive: true });

    await writeFile(filePath, buffer);
    console.log(`open ${filePath} to see the uploaded file`);

    const fileUrl = `/uploads/doctors/${file.name}`;

    const updatedDoctor = await prisma.doctor.update({
      where: { userId: session.user.id },
      data: {
        profilePictureUrl: fileUrl,
        user: {
          update: {
            image: fileUrl
          }
        }
      }
    });

    return createSuccessResponse({ imageUrl: fileUrl }, "Image uploaded successfully");

  } catch (error) {
    console.error("Failed to upload image:", error)
    throw error
  }
});
