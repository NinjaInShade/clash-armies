/// <reference types="vitest" />

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const changelogPath = fileURLToPath(new URL('CHANGELOG.md', import.meta.url));
const changelog = readFileSync(changelogPath, 'utf8');

export default defineConfig((env) => {
	const plugins: PluginOption[] = [sveltekit()];

	// When running `vite dev`
	if (env.command === 'serve') {
		// Useful to test certain APIs like `navigator.share` which are only available on HTTPS.
		// Running `npm run start:https` will automatically use this flag
		if (process.env.DEV_HTTPS) {
			plugins.push(basicSsl());
		}
	}

	return {
		test: {
			include: ['tests/app/**/*.ts'],
			coverage: {
				exclude: ['build/**', 'scripts/**', 'discord/**', 'svelte.config.js', ...coverageConfigDefaults.exclude],
			},
		},
		plugins,
		define: {
			__CHANGELOG__: JSON.stringify(changelog),
		},
	};
});
