import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
	{
		ignores: [
			'.DS_Store',
			'node_modules/**',
			'build/**',
			'dist/**',
			'coverage/**',
			'.svelte-kit/**',
			'package/**',
			'.env',
			'.env.*',
			'!*.env.example',
			'pnpm-lock.yaml',
			'package-lock.json',
			'yarn.lock',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...sveltePlugin.configs['flat/recommended'],
	prettier,
	{
		languageOptions: {
			parser: tseslint.parser,
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},
	{
		rules: {
			'svelte/no-navigation-without-resolve': [
				'error',
				{
					ignoreGoto: true,
					ignoreLinks: true,
					ignorePushState: true,
					ignoreReplaceState: true,
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
];
