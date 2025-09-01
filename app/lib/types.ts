export interface SearchConditions<T> {
  AND: Array<{
    isActive?: boolean;
    OR?: Array<T>;
    organizationId?: string;
    specialty?: {
      name: { contains: string; mode: 'insensitive' };
    };
  }>;
}

export type DoctorSearchFields = {
  user?: {
    firstName?: { contains: string; mode: 'insensitive' };
    lastName?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
  };
  medicalLicenseNumber?: { contains: string; mode: 'insensitive' };
};

export type HSPSearchFields = {
  user?: {
    firstName?: { contains: string; mode: 'insensitive' };
    lastName?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
  };
  licenseNumber?: { contains: string; mode: 'insensitive' };
};
