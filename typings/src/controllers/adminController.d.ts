
declare interface whereClauseType {
	getMedicines(req: any, res: any, next: any): Promise<void>;

	getSystemStats(req: any, res: any, next: any): Promise<void>;

	updateDoctorStatus(req: any, res: any, next: any): Promise<null>;
}
