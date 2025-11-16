# Agent Guidelines

## Commands

- **Test single file**: `npm test --prefix api -- <file-pattern>` or `npm test --prefix ui -- --include='<file-pattern>'`
- **Run tests**: `npm test --prefix api` (NestJS), `npm test --prefix ui` (Angular)
- **Run E2E tests**: `npm run test:e2e --prefix api`
- **Lint**: `npx eslint api/**/*.ts --fix` or `npx eslint ui/**/*.ts --fix`
- **Format**: `npm run prettier` (root), `npm run format --prefix api`
- **Build**: `npm run build --prefix api`, `npm run build --prefix ui`

## Code Style

- **Formatting**: Tabs (4 width), 100 char lines, single quotes, trailing commas, semicolons
- **Imports**: Group by external, then internal; NestJS uses `@nestjs/*` first, Angular uses `inject()` function
- **Types**: Explicit types required (strict mode enabled); avoid `any` where possible
- **Naming**: PascalCase (classes), camelCase (variables/functions), SCREAMING_SNAKE_CASE (constants/tokens)
- **Error handling**: Use NestJS exceptions (`NotFoundException`, etc.); Angular services use RxJS `catchError`
- **Architecture**: Hexagonal (API) - core/services contain business logic, adapters/in for controllers, adapters/out for DB
- **Ports pattern**: Use dependency injection tokens (e.g., `PROJECT_PORT`) for port interfaces
- **Angular**: Standalone components, signals for state, private fields with `#` prefix, `inject()` in constructors
- **Validation**: Use class-validator decorators in DTOs; validate user authentication in services
- **Database**: Never use `synchronize: true` - always create migrations in `db/` directory
- **Icons**: Use `lucide-angular` for icons in the UI, not SVG.
- **Internationalization (i18n)**:
    - All UI text must use i18n keys from `/ui/public/assets/i18n/` files
    - Import `TranslateModule` in component imports array for template translations
    - Import and inject `TranslateService` as `#translate` for programmatic translations
    - Use `{{ 'key.path' | translate }}` in templates
    - Use `this.#translate.instant('key.path', { param: value })` for interpolated messages in TypeScript
    - Add new translations to both `en.json` and `es.json` files
    - Never hard-code English text in components
