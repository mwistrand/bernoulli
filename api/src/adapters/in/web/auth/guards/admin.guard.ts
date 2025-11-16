import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../../../core/models/auth/user.model';

@Injectable()
export class AdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();

		if (!request.isAuthenticated()) {
			return false;
		}

		const user = request.user;
		if (user?.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Only administrators can perform this action');
		}

		return true;
	}
}
