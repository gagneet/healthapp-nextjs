
declare interface responseDataType {
	updateDoctor(req: any, res: any, next: any): Promise<null>;

	getDoctorPatients(req: any, res: any, next: any): Promise<null>;
}
