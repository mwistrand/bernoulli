import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
	@IsString()
	@IsNotEmpty({ message: 'Task title is required' })
	@MaxLength(300, { message: 'Task title must not exceed 300 characters' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
	title!: string;

	@IsString()
	@MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
	@Transform(({ value }) => (value && typeof value === 'string' ? value.trim() : undefined))
	description!: string;

	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Task summary must not exceed 500 characters' })
	@Transform(({ value }) => (value && typeof value === 'string' ? value.trim() : undefined))
	summary?: string;
}
