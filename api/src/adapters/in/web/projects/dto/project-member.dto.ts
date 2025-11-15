import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectRole } from '../../../../../core/models/projects/project-member.model';

export class AddMemberDto {
	@IsString()
	@IsNotEmpty()
	userId!: string;

	@IsEnum(ProjectRole)
	role!: ProjectRole;
}

export class UpdateRoleDto {
	@IsEnum(ProjectRole)
	role!: ProjectRole;
}
