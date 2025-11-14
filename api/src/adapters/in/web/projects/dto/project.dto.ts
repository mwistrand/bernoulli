import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
	@IsString()
	@IsNotEmpty({ message: 'Project name is required' })
	@MaxLength(100, { message: 'Project name must not exceed 100 characters' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Description must not exceed 500 characters' })
	@Transform(({ value }) => (value && typeof value === 'string' ? value.trim() : undefined))
	description?: string;
}
