import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Inject,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectMemberService } from 'src/core/services/projects/project-member.service';
import { AddMemberDto, UpdateRoleDto } from './dto/project-member.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

@Controller('projects/:projectId/members')
@UseGuards(AuthenticatedGuard)
export class ProjectMemberController {
	constructor(
		@Inject(ProjectMemberService)
		private readonly projectMemberService: ProjectMemberService,
	) {}

	@Get('')
	getMembers(@Param('projectId') projectId: string, @Req() request: Request) {
		const userId = (request.user! as any).userId as string;
		return this.projectMemberService.getProjectMembers(projectId, userId);
	}

	@Post('')
	@HttpCode(201)
	addMember(
		@Param('projectId') projectId: string,
		@Body() dto: AddMemberDto,
		@Req() request: Request,
	) {
		const userId = (request.user! as any).userId as string;
		return this.projectMemberService.addMember(projectId, userId, dto.userId, dto.role);
	}

	@Delete(':userId')
	@HttpCode(204)
	async removeMember(
		@Param('projectId') projectId: string,
		@Param('userId') targetUserId: string,
		@Req() request: Request,
	) {
		const userId = (request.user! as any).userId as string;
		await this.projectMemberService.removeMember(projectId, userId, targetUserId);
	}

	@Patch(':userId/role')
	updateMemberRole(
		@Param('projectId') projectId: string,
		@Param('userId') targetUserId: string,
		@Body() dto: UpdateRoleDto,
		@Req() request: Request,
	) {
		const userId = (request.user! as any).userId as string;
		return this.projectMemberService.updateMemberRole(
			projectId,
			userId,
			targetUserId,
			dto.role,
		);
	}
}
