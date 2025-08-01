
declare interface whereClauseType {
	completeEvent(eventId: any, completionData: any): Promise<any>;

	getUpcomingEvents(userId: any, userCategory: any, days: number): Promise<any>;
}
