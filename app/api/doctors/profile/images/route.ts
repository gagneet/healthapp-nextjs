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
import { writeFile, mkdir } from 'fs/promises'
import path, { join } from 'path'


export const dynamic = 'force-dynamic';

const MB = 1024 * 1024;

const MAX_FILE_SIZE = 5 * MB; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / MB}MB`), 400);
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return createErrorResponse(new Error(`File type not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`), 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique name
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

    const publicDir = join(process.cwd(), 'public', 'uploads', 'doctors');
    const filePath = join(publicDir, uniqueFilename);

    // Ensure directory exists
    await mkdir(publicDir, { recursive: true });

    await writeFile(filePath, buffer);
    console.log(`open ${filePath} to see the uploaded file`);

    const fileUrl = `/uploads/doctors/${uniqueFilename}`;

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

    return createSuccessResponse({ imageUrl: fileUrl, message: "Image uploaded successfully" });

  } catch (error) {
    console.error("Failed to upload image:", error)
    throw error
  }
});
