import { Prisma } from '@prisma/client';

export const userSelect = {
  select: {
    firstName: true,
    lastName: true,
    name: true,
    email: true,
  },
};
