import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(new URL('package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(path, 'utf8'));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Where the final node build that uses the vite build goes.
			// This is the code that gets deployed to prod.
			out: 'dist'
		}),
		alias: {
			'~': 'src'
		},
		files: {
			hooks: {
				server: 'src/lib/server/hooks.server.ts'
			}
		},
		version: { name: pkg.version },
		// Where the optimized vite build output goes.
		outDir: 'build'
	}
};

export default config;
