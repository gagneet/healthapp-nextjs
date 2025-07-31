
declare interface responseDataType {
	getPatients(req: any, res: any, next: any): Promise<void>;

	createPatient(req: any, res: any, next: any): Promise<void>;

	updatePatient(req: any, res: any, next: any): Promise<null>;

	deletePatient(req: any, res: any, next: any): Promise<null>;
}
