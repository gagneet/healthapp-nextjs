
declare interface responseDataType {
	createMedication(req: any, res: any, next: any): Promise<void>;

	getMedicationTimeline(req: any, res: any, next: any): Promise<null>;

	calculateRemaining(medication: any): any;

	calculateTotal(medication: any): any;

	generateRRule(repeatType: any, startDate: any): any;

	createMedicationSchedule(medication: any): Promise<void>;
}
