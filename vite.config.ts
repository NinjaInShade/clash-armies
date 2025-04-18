/// <reference types="vitest" />

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const changelogPath = fileURLToPath(new URL('CHANGELOG.md', import.meta.url));
const changelog = readFileSync(changelogPath, 'utf8');

export default defineConfig({
	test: {
		include: ['tests/app/**/*.ts'],
		coverage: {
			exclude: ['build/**', 'scripts/**', 'discord/**', 'svelte.config.js', ...coverageConfigDefaults.exclude],
		},
	},
	plugins: [sveltekit()],
	define: {
		__CHANGELOG__: JSON.stringify(changelog),
	},
});
