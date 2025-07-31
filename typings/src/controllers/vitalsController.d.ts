
declare interface responseDataType {
	getVitalTimeline(req: any, res: any, next: any): Promise<null>;

	calculateRemaining(vital: any): any;

	calculateTotal(vital: any): any;

	createVitalSchedule(vital: any, repeatDays: any): Promise<void>;
}
