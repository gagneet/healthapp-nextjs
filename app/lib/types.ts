export interface SearchConditions<T> {
  AND: Array<{
    isActive?: boolean | undefined;
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
  licenseNumber?: { contains:string; mode: 'insensitive' };
};

export interface DaySchedule {
  start: string;
  end: string;
  available: boolean;
}

export interface AvailabilitySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}
