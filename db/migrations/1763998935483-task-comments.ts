import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

const TASK_COMMENTS = 'task_comments';
const COMMENT_TASK_INDEX = 'comment_task_index';

export class TaskComments1763998935483 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: TASK_COMMENTS,
				columns: [
					{ name: 'id', type: 'varchar', isPrimary: true },
					{ name: 'taskId', type: 'varchar' },
					{ name: 'comment', type: 'text' },
					{ name: 'createdBy', type: 'varchar' },
					{ name: 'createdAt', type: 'timestamp', default: 'now()' },
					{ name: 'lastUpdatedBy', type: 'varchar' },
					{ name: 'lastUpdatedAt', type: 'timestamp', default: 'now()' },
				],
			}),
		);

		await queryRunner.createForeignKey(
			TASK_COMMENTS,
			new TableForeignKey({
				columnNames: ['taskId'],
				referencedColumnNames: ['id'],
				referencedTableName: 'tasks',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			TASK_COMMENTS,
			new TableForeignKey({
				columnNames: ['createdBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			TASK_COMMENTS,
			new TableForeignKey({
				columnNames: ['lastUpdatedBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createIndex(
			TASK_COMMENTS,
			new TableIndex({
				name: COMMENT_TASK_INDEX,
				columnNames: ['taskId'],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropIndex(TASK_COMMENTS, COMMENT_TASK_INDEX);
		await queryRunner.dropTable(TASK_COMMENTS);
	}
}
