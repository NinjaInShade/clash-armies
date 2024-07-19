import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const changelogPath = fileURLToPath(new URL('CHANGELOG.md', import.meta.url));
const changelog = readFileSync(changelogPath, 'utf8');

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__CHANGELOG__: JSON.stringify(changelog),
	},
});
