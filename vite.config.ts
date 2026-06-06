/// <reference types="vitest" />

import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type PluginOption } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(new URL('package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(path, 'utf8'));

const changelogPath = fileURLToPath(new URL('CHANGELOG.md', import.meta.url));
const changelog = readFileSync(changelogPath, 'utf8');

export default defineConfig((env) => {
	const plugins: PluginOption[] = [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({
				// Where the final node build that uses the vite build goes.
				// This is the code that gets deployed to prod.
				out: 'dist',
			}),
			alias: {
				'~': 'src',
				$types: 'src/lib/shared/types',
				$components: 'src/components',
				$models: 'src/lib/models',
				$client: 'src/lib/client',
				$server: 'src/lib/server',
				$shared: 'src/lib/shared',
			},
			files: {
				hooks: {
					server: 'src/lib/server/hooks.server.ts',
				},
			},
			version: { name: pkg.version },
			// Where the optimized vite build output goes.
			outDir: 'build',
		}),
	];

	// When running `vite dev`
	if (env.command === 'serve') {
		// Useful to test certain APIs like `navigator.share` which are only available on HTTPS.
		// Running `pnpm run start:https` will automatically use this flag
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
			fileParallelism: false,
		},
		plugins,
		define: {
			__CHANGELOG__: JSON.stringify(changelog),
		},
	};
});
