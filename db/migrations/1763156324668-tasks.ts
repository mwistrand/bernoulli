import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export const TASKS = 'tasks';
export const TASKS_TITLE_INDEX = 'tasks_title_index';
export const TASKS_PROJECT_INDEX = 'task_project_index';

export class Tasks1763156324668 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: TASKS,
				columns: [
					{ name: 'id', type: 'varchar', isPrimary: true },
					{ name: 'projectId', type: 'varchar' },
					{ name: 'title', type: 'varchar' },
					{ name: 'description', type: 'varchar' },
					{ name: 'summary', type: 'varchar', isNullable: true },
					{ name: 'createdBy', type: 'varchar' },
					{ name: 'createdAt', type: 'timestamp', default: 'now()' },
					{ name: 'lastUpdatedBy', type: 'varchar' },
					{ name: 'lastUpdatedAt', type: 'timestamp', default: 'now()' },
				],
			}),
		);

		await queryRunner.createForeignKey(
			TASKS,
			new TableForeignKey({
				columnNames: ['projectId'],
				referencedColumnNames: ['id'],
				referencedTableName: 'projects',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			TASKS,
			new TableForeignKey({
				columnNames: ['createdBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			TASKS,
			new TableForeignKey({
				columnNames: ['lastUpdatedBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createIndex(
			TASKS,
			new TableIndex({
				name: TASKS_TITLE_INDEX,
				columnNames: ['title'],
			}),
		);

		await queryRunner.createIndex(
			TASKS,
			new TableIndex({
				name: TASKS_PROJECT_INDEX,
				columnNames: ['projectId'],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropIndex(TASKS, TASKS_PROJECT_INDEX);
		await queryRunner.dropIndex(TASKS, TASKS_TITLE_INDEX);
		await queryRunner.dropTable(TASKS);
	}
}
