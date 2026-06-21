/**
 * `src/lib/assets/` (aka `$assets/`), contain optimised vite assets with aggressive caching from sveltekit's node-adapter.
 * See https://svelte.dev/docs/kit/images#Vite's-built-in-handling.
 *
 * Some of these assets (e.g. unit images) want to be dynamically imported, but since their names will
 * be transformed in the prod build for caching reasons, we must utilise import.meta.glob and expose
 * an API for call sites to obtain the correct URL both in dev+prod.
 */

const bannerFiles = import.meta.glob<string>('$assets/banners/*.webp', { eager: true, query: '?url', import: 'default' });
const bannerURLByName = createURLByNameMap(bannerFiles);

const thFiles = import.meta.glob<string>('$assets/town-halls/*.webp', { eager: true, query: '?url', import: 'default' });
const thURLByName = createURLByNameMap(thFiles);

const unitFiles = import.meta.glob<string>('$assets/units/*.webp', { eager: true, query: '?url', import: 'default' });
const unitURLByName = createURLByNameMap(unitFiles);

const heroFiles = import.meta.glob<string>('$assets/heroes/*.webp', { eager: true, query: '?url', import: 'default' });
const heroURLByName = createURLByNameMap(heroFiles);

const equipmentFiles = import.meta.glob<string>('$assets/heroes/equipment/*.webp', { eager: true, query: '?url', import: 'default' });
const equipmentURLByName = createURLByNameMap(equipmentFiles);

const petFiles = import.meta.glob<string>('$assets/heroes/pets/*.webp', { eager: true, query: '?url', import: 'default' });
const petURLByName = createURLByNameMap(petFiles);

export function bannerImgURL(bannerName: string, variant: 'regular' | 'small' | 'large' = 'regular') {
	const variantName = `${bannerName}${variant !== 'regular' ? `_${variant}` : ''}`;
	return bannerURLByName.get(variantName);
}

export function thImgURL(level: number, variant: 'regular' | 'small' | 'large' = 'regular') {
	const variantName = `${level}${variant !== 'regular' ? `_${variant}` : ''}`;
	return thURLByName.get(variantName);
}

/**
 * NOTE: `thin` variant is an edge case, mainly for the "Stone Slammer" siege machine.
 */
export function unitImgURL(unitName: string, variant: 'regular' | 'small' | 'thin' = 'regular') {
	const variantName = `${unitName}${variant !== 'regular' ? `_${variant}` : ''}`;
	return unitURLByName.get(variantName);
}

export function heroImgURL(hero: string, variant: 'regular' | 'full-height' = 'regular') {
	const variantName = `${hero}${variant !== 'regular' ? `_${variant}` : ''}`;
	return heroURLByName.get(variantName);
}

export function equipmentImgURL(equipment: string, variant: 'regular' | 'small' = 'regular') {
	const variantName = `${equipment}${variant !== 'regular' ? `_${variant}` : ''}`;
	return equipmentURLByName.get(variantName);
}

export function petImgURL(pet: string, variant: 'regular' = 'regular') {
	const variantName = `${pet}${variant !== 'regular' ? `_${variant}` : ''}`;
	return petURLByName.get(variantName);
}

function createURLByNameMap(globFiles: Record<string, string>) {
	const urlByName = new Map<string, string>();
	for (const [path, url] of Object.entries(globFiles)) {
		// NOTE: won't work for nested directories
		const name = path.split('/').pop()!.replace('.webp', '');
		urlByName.set(name, url);
	}
	return urlByName;
}
