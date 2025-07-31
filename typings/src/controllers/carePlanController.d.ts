
declare interface responseDataType {
	createCarePlan(req: any, res: any, next: any): Promise<null>;

	updateCarePlan(req: any, res: any, next: any): Promise<null>;
}
