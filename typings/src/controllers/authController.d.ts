
declare interface tokenPayloadType {
	signUp(req: any, res: any, next: any): Promise<null>;

	refreshToken(req: any, res: any, next: any): Promise<null>;
}
