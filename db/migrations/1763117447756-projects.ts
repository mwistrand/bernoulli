import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export const PROJECTS = 'projects';
export const PROJECTS_NAME_INDEX = 'projects_name_index';

export class Projects1763117447756 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: PROJECTS,
				columns: [
					{ name: 'id', type: 'varchar', isPrimary: true },
					{ name: 'name', type: 'varchar', isUnique: true },
					{ name: 'description', type: 'varchar' },
					{ name: 'createdBy', type: 'varchar' },
					{ name: 'createdAt', type: 'timestamp', default: 'now()' },
					{ name: 'lastUpdatedBy', type: 'varchar' },
					{ name: 'lastUpdatedAt', type: 'timestamp', default: 'now()' },
				],
			}),
		);

		await queryRunner.createForeignKey(
			PROJECTS,
			new TableForeignKey({
				columnNames: ['createdBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createForeignKey(
			PROJECTS,
			new TableForeignKey({
				columnNames: ['lastUpdatedBy'],
				referencedColumnNames: ['id'],
				referencedTableName: 'users',
				onDelete: 'CASCADE',
			}),
		);

		await queryRunner.createIndex(
			PROJECTS,
			new TableIndex({
				name: PROJECTS_NAME_INDEX,
				columnNames: ['name'],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		const table = await queryRunner.getTable(PROJECTS);
		const foreignKeys = table?.foreignKeys.filter(
			fk => fk.columnNames.includes('createdBy') || fk.columnNames.includes('lastUpdatedBy'),
		);
		foreignKeys?.forEach(async foreignKey => {
			await queryRunner.dropForeignKey(PROJECTS, foreignKey);
		});
		await queryRunner.dropIndex(PROJECTS, PROJECTS_NAME_INDEX);
		await queryRunner.dropTable(PROJECTS);
	}
}
