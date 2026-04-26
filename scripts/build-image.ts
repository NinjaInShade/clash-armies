import util from '@ninjalib/util';
import { APP_NAME, REGISTRY, parseArgs, readPkgJson, resolveImageTag, spawn, newline } from './utils.ts';

/**
 * Script to build a new docker image.
 * Requires github permissions, so is not intended for contributors.
 * Soon I'd like this to be part of CI/CD, and also expose a friendly way of testing production for contributors.
 */

const log = util.logger('ca:build-image');

newline();

async function main() {
	const { opts, warnings } = parseArgs();
	for (const w of warnings) log.warn(w);

	if (opts['--help'] || opts['-h']) {
		console.log(`Builds a new docker image and pushes it to the registry.`);
		console.log(`Options:`);
		console.log(`  --devel: tag image with '--devel' suffix (use for wip/staging tests)`);
		return;
	}

	const develMode = Boolean(opts['--devel']);

	let pkgJson;
	try {
		pkgJson = await readPkgJson();
	} catch (err) {
		log.error('Unable to read package.json:', err);
		return;
	}

	const tag = resolveImageTag(pkgJson, develMode);
	const imageRef = `${REGISTRY}/${APP_NAME}:${tag}`;

	if (develMode) {
		log.warn(`Building development image ${imageRef}`);
	} else {
		log.info(`Building release image ${imageRef}`);
	}
	newline();

	await spawn(`docker build -t ${imageRef} .`);
	newline();
	log.info('Image built');

	log.info(`Pushing ${imageRef} to registry...`);
	newline();
	await spawn(`docker push ${imageRef}`);
	newline();
	log.info('Image pushed');
}

await main();
