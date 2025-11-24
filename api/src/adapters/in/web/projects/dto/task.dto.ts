import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
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

export class UpdateTaskDto {
	@IsOptional()
	@ValidateIf((o, value) => value !== undefined)
	@IsString()
	@IsNotEmpty({ message: 'Task title cannot be empty' })
	@MaxLength(300, { message: 'Task title must not exceed 300 characters' })
	@Transform(({ value }) => (value !== null && typeof value === 'string' ? value.trim() : value))
	title?: string;

	@IsOptional()
	@ValidateIf((o, value) => value !== undefined)
	@IsString()
	@MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
	@Transform(({ value }) => (value !== null && typeof value === 'string' ? value.trim() : value))
	description?: string;

	@IsOptional()
	@ValidateIf((o, value) => value !== undefined && value !== null)
	@IsString()
	@MaxLength(500, { message: 'Task summary must not exceed 500 characters' })
	@Transform(({ value }) => (value !== null && typeof value === 'string' ? value.trim() : value))
	summary?: string | null;
}

export class AddTaskCommentDto {
	@IsString()
	@IsNotEmpty({ message: 'Comment is required' })
	@MaxLength(5000, { message: 'Comment must not exceed 5000 characters' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
	comment!: string;
}

export class UpdateTaskCommentDto {
	@IsString()
	@IsNotEmpty({ message: 'Comment is required' })
	@MaxLength(5000, { message: 'Comment must not exceed 5000 characters' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
	comment!: string;
}
