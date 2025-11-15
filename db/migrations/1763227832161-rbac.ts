import { MigrationInterface, QueryRunner } from "typeorm";

export class Rbac1763227832161 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create enum type for user role
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'USER')
        `);

        // 2. Add role column to users table
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "role" "user_role_enum" NOT NULL DEFAULT 'USER'
        `);

        // 3. Set first user to ADMIN role (if exists)
        await queryRunner.query(`
            UPDATE "users"
            SET "role" = 'ADMIN'
            WHERE "id" = (
                SELECT "id"
                FROM "users"
                ORDER BY "createdAt" ASC
                LIMIT 1
            )
        `);

        // 4. Create enum type for project role
        await queryRunner.query(`
            CREATE TYPE "project_role_enum" AS ENUM ('ADMIN', 'USER')
        `);

        // 5. Create project_members table
        await queryRunner.query(`
            CREATE TABLE "project_members" (
                "id" character varying NOT NULL,
                "projectId" character varying NOT NULL,
                "userId" character varying NOT NULL,
                "role" "project_role_enum" NOT NULL DEFAULT 'USER',
                "createdAt" TIMESTAMP NOT NULL,
                "lastUpdatedAt" TIMESTAMP NOT NULL,
                CONSTRAINT "UQ_project_user" UNIQUE ("projectId", "userId"),
                CONSTRAINT "PK_project_members" PRIMARY KEY ("id")
            )
        `);

        // 6. Add foreign keys for project_members
        await queryRunner.query(`
            ALTER TABLE "project_members"
            ADD CONSTRAINT "FK_project_members_project"
            FOREIGN KEY ("projectId")
            REFERENCES "projects"("id")
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "project_members"
            ADD CONSTRAINT "FK_project_members_user"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

        // 7. Migrate existing projects - add creator as ADMIN member
        await queryRunner.query(`
            INSERT INTO "project_members" ("id", "projectId", "userId", "role", "createdAt", "lastUpdatedAt")
            SELECT
                gen_random_uuid(),
                p."id",
                p."createdBy",
                'ADMIN'::project_role_enum,
                p."createdAt",
                p."lastUpdatedAt"
            FROM "projects" p
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop foreign keys
        await queryRunner.query(`
            ALTER TABLE "project_members"
            DROP CONSTRAINT "FK_project_members_user"
        `);

        await queryRunner.query(`
            ALTER TABLE "project_members"
            DROP CONSTRAINT "FK_project_members_project"
        `);

        // 2. Drop project_members table
        await queryRunner.query(`
            DROP TABLE "project_members"
        `);

        // 3. Drop project role enum
        await queryRunner.query(`
            DROP TYPE "project_role_enum"
        `);

        // 4. Drop role column from users
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "role"
        `);

        // 5. Drop user role enum
        await queryRunner.query(`
            DROP TYPE "user_role_enum"
        `);
    }

}
