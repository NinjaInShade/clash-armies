import child_process from 'node:child_process';
import fsp from 'node:fs/promises';
import readline from 'node:readline/promises';

export type ScriptOptions = Record<string, string | boolean>;

export type PkgJSON = {
	version: string;
	engines: Record<string, string>;
};

export const APP_NAME = 'clash-armies';
export const REMOTE_APP_DIR = `/var/${APP_NAME}`;
export const REGISTRY = 'ghcr.io/ninjainshade';

export function parseArgs(): { opts: ScriptOptions; warnings: string[] } {
	const argv = process.argv.slice(2);
	const warnings: string[] = [];
	const seen = new Set<string>();
	const opts = argv.reduce<ScriptOptions>((prev, curr) => {
		const [name, value] = curr.split('=');
		if (seen.has(name)) {
			warnings.push(`Duplicate option "${name}" found`);
		}
		seen.add(name);
		prev[name] = value || true;
		return prev;
	}, {});
	return { opts, warnings };
}

export async function readPkgJson(): Promise<PkgJSON> {
	const raw = await fsp.readFile('package.json', 'utf-8');
	return JSON.parse(raw);
}

export async function run(cmd: string) {
	return new Promise<string>((resolve, reject) => {
		child_process.exec(cmd, (err, stdout, stderr) => {
			if (!err) {
				resolve(stdout.trim());
				return;
			}
			err.cause = stderr.trim();
			reject(err);
		});
	});
}

export async function spawn(cmd: string, args: string[] = []) {
	return new Promise<void>((resolve, reject) => {
		const proc = child_process.spawn(cmd, args, { shell: true, stdio: 'inherit' });
		proc.on('error', reject);
		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				const err = new Error(`Command "${cmd}" exited with code ${code}`);
				err.code = code;
				reject(err);
			}
		});
	});
}

export async function ask(question: string): Promise<string> {
	const rl = readline.createInterface(process.stdin, process.stdout);
	const answer = await rl.question(question);
	await rl.close();
	return answer;
}

export function newline() {
	console.log('');
}

/**
 * Resolves the docker image tag for a build.
 */
export function resolveImageTag(pkgJson: PkgJSON, develMode: boolean): string {
	let tag = pkgJson.version;
	if (develMode) {
		tag += '--devel';
	}
	return tag;
}
