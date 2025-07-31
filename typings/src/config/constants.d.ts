
declare interface USER_CATEGORIESType {
	static DOCTOR: string;

	static PATIENT: string;

	static CARE_TAKER: string;

	static HSP: string;

	static PROVIDER: string;

	static ADMIN: string;
}

declare interface ACCOUNT_STATUSType {
	static PENDING_VERIFICATION: string;

	static ACTIVE: string;

	static INACTIVE: string;

	static DEACTIVATED: string;

	static SUSPENDED: string;
}

declare interface EVENT_TYPESType {
	static APPOINTMENT: string;

	static REMINDER: string;

	static MEDICATION_REMINDER: string;

	static VITALS: string;

	static CAREPLAN_ACTIVATION: string;

	static DIET: string;

	static WORKOUT: string;
}

declare interface EVENT_STATUSType {
	static SCHEDULED: string;

	static PENDING: string;

	static COMPLETED: string;

	static EXPIRED: string;

	static CANCELLED: string;

	static STARTED: string;

	static PRIOR: string;
}

declare interface PAGINATIONType {
	static DEFAULT_PAGE: number;

	static DEFAULT_LIMIT: number;

	static MAX_LIMIT: number;
}

declare interface RESPONSE_MESSAGESType {
	static SUCCESS: string;

	static CREATED: string;

	static UPDATED: string;

	static DELETED: string;

	static NOT_FOUND: string;

	static UNAUTHORIZED: string;

	static FORBIDDEN: string;

	static VALIDATION_ERROR: string;

	static INTERNAL_ERROR: string;
}
