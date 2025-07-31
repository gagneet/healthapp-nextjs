
declare interface schemasType {
	static login: {
	static email: any;

	static password: any;
	};

	static patientCreate: {
	static first_name: any;

	static middle_name: any;

	static last_name: any;

	static email: any;

	static mobile_number: any[];

	static gender: any;

	static dob: any;

	static address: any;

	static height_cm: any;

	static weight_kg: any;

	static comorbidities: any;

	static allergies: any;
	};

	static medicationCreate: {
	static medicine_id: any;

	static quantity: any;

	static strength: any;

	static unit: any;

	static when_to_take: any;

	static repeat_type: any;

	static start_date: any;

	static end_date: any;

	static instructions: any;
	};

	static appointmentCreate: {
	static patient_id: any;

	static description: any;

	static start_date: any;

	static end_date: any;

	static appointment_type: any;

	static repeat_type: any;

	static repeat_count: any;
	};

	static pagination: {
	static page: any;

	static limit: any;

	static search: any;

	static sortBy: any;

	static sortOrder: any;
	};
}
