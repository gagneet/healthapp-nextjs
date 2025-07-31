
declare interface responseDataType {
	getAppointmentsByDate(req: any, res: any, next: any): Promise<null>;

	getOrganizerDetails(organizerType: any, organizerId: any): Promise<any>;

	getParticipantDetails(participantType: any, participantId: any): Promise<any>;

	generateRRule(repeatType: any): any;

	createAppointmentSchedule(appointment: any, repeatCount: number): Promise<void>;
}
