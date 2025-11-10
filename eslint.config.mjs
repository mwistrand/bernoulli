// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import angularEslint from '@angular-eslint/eslint-plugin';
import angularEslintTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import angularEslintConfig from '@angular-eslint/eslint-plugin/dist/configs/recommended.json' with { type: 'json' };

export default [
	eslintPluginPrettierRecommended,
	// Ignore patterns
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
	},
	// API (NestJS/TypeScript)
	{
		files: ['api/**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: './api/tsconfig.json',
				tsconfigRootDir: process.cwd(),
			},
			globals: {
				...globals.node,
				...globals.jest,
			},
			sourceType: 'module',
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			...tseslint.configs.recommendedTypeChecked.rules,
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'warn',
		},
	},
	// UI (Angular TypeScript)
	{
		files: ['ui/**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: process.cwd(),
			},
			globals: {
				...globals.browser,
			},
			sourceType: 'module',
		},
		plugins: {
			'@angular-eslint': angularEslint,
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			...angularEslintConfig.rules,
			...tseslint.configs.recommendedTypeChecked.rules,
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
		},
	},
	// UI (Angular HTML templates)
	{
		files: ['ui/**/*.html'],
		languageOptions: {
			parser: angularTemplateParser,
		},
		plugins: {
			'@angular-eslint/template': angularEslintTemplate,
		},
		rules: {
			// Add template rules here if needed
		},
	},
];
