import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createSuccessResponse,
  createUnauthorizedResponse,
  withErrorHandling,
} from "@/lib/api-response";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const doctors = await prisma.doctor.findMany({
      include: {
          user: true,
      }
  });

  return createSuccessResponse(doctors);
});
