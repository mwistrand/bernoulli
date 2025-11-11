import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const USERS = 'users';
const USERS_EMAIL_INDEX = 'users_email_index';

export class Users1762953916458 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: USERS,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          { name: 'name', type: 'varchar' },
          { name: 'createdAt', type: 'timestamp' },
          { name: 'lastUpdatedAt', type: 'timestamp' },
        ]
      })
    );

    await queryRunner.createIndex(
      USERS,
      new TableIndex({
        name: USERS_EMAIL_INDEX,
        columnNames: ['email'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(USERS, USERS_EMAIL_INDEX);
    await queryRunner.dropTable(USERS);
  }

}
