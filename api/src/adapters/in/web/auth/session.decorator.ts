import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Session } from './session.types';

export const SessionData = createParamDecorator((data: unknown, ctx: ExecutionContext): Session => {
	const request = ctx.switchToHttp().getRequest();
	return request.session;
});
