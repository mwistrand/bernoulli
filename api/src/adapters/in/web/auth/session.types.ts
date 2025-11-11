import { Session as ExpressSession } from 'express-session';

export interface SessionData {
	userId?: string;
	email?: string;
	name?: string;
}

export type Session = ExpressSession & SessionData;

// Dummy value for runtime import
export const SessionType = null as any;
