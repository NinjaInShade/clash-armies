import type { AppState, Army, Unit, Pet, Equipment, ArmyUnit, ArmyEquipment, ArmyPet, ImportedUnit, ImportedHero } from '$types';
import type { Component } from 'svelte';
import {
	VALID_HEROES,
	hasHero,
	requireTroopByClashID,
	requireSpellByClashID,
	requirePetByClashID,
	requireEquipmentByClashID,
	HERO_CLASH_IDS,
} from '$shared/utils';
import C from '$components';

/**
 * Generates URL link to copy army into clash of clans.
 *
 * Example: https://link.clashofclans.com/en?action=CopyArmy&army=u10x0-2x3s1x9-3x2
 */
export function generateLink(units: ArmyUnit[], ccUnits: ArmyUnit[], equipment: ArmyEquipment[], pets: ArmyPet[]): string {
	function buildUnitStr(units: ArmyUnit[]) {
		return units
			.reduce<string[]>((prev, unit) => {
				const troopString = `${unit.amount}x${+unit.clashId}`;
				prev.push(troopString);
				return prev;
			}, [])
			.join('-');
	}
	function buildHeroesStr(heroes: Record<string, { pet?: ArmyPet; eq1?: ArmyEquipment; eq2?: ArmyEquipment }>) {
		return Object.entries(heroes)
			.reduce<string[]>((prev, [name, hero]) => {
				const clashId = HERO_CLASH_IDS[name];
				let heroStr = clashId;
				if (hero.pet) {
					heroStr += `p${hero.pet.clashId}`;
				}
				if (hero.eq1 || hero.eq2) {
					const firstEq = hero.eq1 || hero.eq2;
					const secondEq = firstEq === hero.eq1 ? hero.eq2 : hero.eq1;
					heroStr += `e${firstEq?.clashId}`;
					if (secondEq) {
						heroStr += `_${secondEq.clashId}`;
					}
				}
				prev.push(heroStr);
				return prev;
			}, [])
			.join('-');
	}

	let url = 'https://link.clashofclans.com/?action=CopyArmy&army=';

	const selectedTroops = units.filter((item) => item.type === 'Troop' || item.type === 'Siege');
	const selectedSpells = units.filter((item) => item.type === 'Spell');
	const selectedCCTroops = ccUnits.filter((item) => item.type === 'Troop' || item.type === 'Siege');
	const selectedCCSpells = ccUnits.filter((item) => item.type === 'Spell');
	const heroes: Record<string, { pet?: ArmyPet; eq1?: ArmyEquipment; eq2?: ArmyEquipment }> = {};

	for (const eq of equipment) {
		if (!(eq.hero in heroes)) {
			heroes[eq.hero] = {};
		}
		if (!heroes[eq.hero].eq1) {
			heroes[eq.hero].eq1 = eq;
		} else if (!heroes[eq.hero].eq2) {
			heroes[eq.hero].eq2 = eq;
		}
	}
	for (const pet of pets) {
		if (!(pet.hero in heroes)) {
			heroes[pet.hero] = {};
		} else if (!heroes[pet.hero].pet) {
			heroes[pet.hero].pet = pet;
		}
	}

	console.log('??', equipment, pets, heroes);

	// generate heroes
	if (Object.keys(heroes).length) {
		url += 'h';
		url += buildHeroesStr(heroes);
	}
	// generate cc troops
	if (selectedCCTroops.length) {
		url += 'i';
		url += buildUnitStr(selectedCCTroops);
	}
	// generate cc spells
	if (selectedCCSpells.length) {
		url += 'd';
		url += buildUnitStr(selectedCCSpells);
	}
	// generate troops
	if (selectedTroops.length) {
		url += 'u';
		url += buildUnitStr(selectedTroops);
	}
	// generate spells
	if (selectedSpells.length) {
		url += 's';
		url += buildUnitStr(selectedSpells);
	}

	return url;
}

const ARMY_LINK_SEPARATOR = /h(?<heroes>[^idus]+)|i(?<castle_units>[\d+x-]+)|d(?<castle_spells>[\d+x-]+)|u(?<units>[\d+x-]+)|s(?<spells>[\d+x-]+)/gm;
const ARMY_LINK_HERO_PATTERN = /(?<hero_id>\d+)(?:m\d+)?(?:p(?<pet_id>\d+))?(?:e(?<eq1>\d+)(?:_(?<eq2>\d+))?)?/gm;

/**
 * Takes in a clash of clans army link and parses it into clash army units/ccUnits/heroes data.
 */
export function parseLink(fullLink: string, ctx: { units: Unit[]; pets: Pet[]; equipment: Equipment[] }) {
	const url = new URL(fullLink);
	const link = url.searchParams.get('army');
	if (!link) {
		throw new Error(`Import link "${fullLink}" is invalid`);
	}

	function parseUnits(data: string) {
		return data.split('-').map((item) => {
			const [amount, id] = item.split('x').map(Number);
			return { id, amount };
		});
	}
	function mapUnit(data: { id: number; amount: number }, type: 'Troop' | 'Spell', isCC = false) {
		const unit = type === 'Troop' ? requireTroopByClashID(data.id, ctx) : requireSpellByClashID(data.id, ctx);
		return {
			unitId: unit.id,
			home: isCC ? 'clanCastle' : ('armyCamp' as 'clanCastle' | 'armyCamp'),
			amount: data.amount,
			...unit,
			id: undefined,
		};
	}

	let units: ImportedUnit[] = [];
	const ccUnits: ImportedUnit[] = [];
	const heroes: Record<string, ImportedHero> = {};

	for (const match of link.matchAll(ARMY_LINK_SEPARATOR)) {
		if (match.groups?.heroes) {
			for (const hero of match.groups.heroes.split('-')) {
				const m = ARMY_LINK_HERO_PATTERN.exec(hero);
				const groups = m?.groups;
				if (groups) {
					const heroName = Object.entries(HERO_CLASH_IDS).find(([name, id]) => id === parseInt(groups.hero_id, 10))?.[0];
					if (!heroName) {
						throw new Error('Invalid hero ID');
					}
					const hero: (typeof heroes)[string] = {};
					if (groups.pet_id) {
						const pet = requirePetByClashID(parseInt(groups.pet_id, 10), ctx);
						hero.pet = { petId: pet.id, hero: heroName, ...pet, id: undefined };
					}
					if (groups.eq1) {
						const eq = requireEquipmentByClashID(parseInt(groups.eq1, 10), ctx);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						hero.eq1 = { equipmentId: eq.id, ...eq, id: undefined };
					}
					if (groups.eq2) {
						const eq = requireEquipmentByClashID(parseInt(groups.eq2, 10), ctx);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						hero.eq2 = { equipmentId: eq.id, ...eq, id: undefined };
					}
					heroes[heroName] = hero;
				}
				// Reset lastIndex of regex otherwise you get random `null` results from the `exec`.
				ARMY_LINK_HERO_PATTERN.lastIndex = 0;
			}
		} else if (match.groups?.castle_units) {
			const parsed = parseUnits(match.groups.castle_units).map((unit) => mapUnit(unit, 'Troop', true));
			ccUnits.push(...parsed);
		} else if (match.groups?.castle_spells) {
			const parsed = parseUnits(match.groups.castle_spells).map((unit) => mapUnit(unit, 'Spell', true));
			ccUnits.push(...parsed);
		} else if (match.groups?.units) {
			const parsed = parseUnits(match.groups.units).map((unit) => mapUnit(unit, 'Troop'));
			units.push(...parsed);
		} else if (match.groups?.spells) {
			const parsed = parseUnits(match.groups.spells).map((unit) => mapUnit(unit, 'Spell'));
			units.push(...parsed);
		}
	}

	// TODO: support multiple CCs in armies
	const firstSiege = units.find((u) => u.type === 'Siege');
	if (firstSiege) {
		units = units.filter((u) => u.type !== 'Siege' || u === firstSiege);
		firstSiege.amount = 1;
	}

	return { units, ccUnits, heroes };
}

export function openLink(href: string, openInNewTab = true) {
	window.open(href, openInNewTab ? '_blank' : undefined, 'rel="noreferrer"');
}

export async function copyLink(units: ArmyUnit[], ccUnits: ArmyUnit[], equipment: ArmyEquipment[], pets: ArmyPet[], app: AppState) {
	const link = generateLink(units, ccUnits, equipment, pets);
	await copy(link);
	app.notify({ title: 'Copied army!', description: 'Successfully copied army link to clipboard', theme: 'success' });
}

async function copy(text: string) {
	if ('navigator' in window && window.navigator.clipboard) {
		try {
			await navigator.clipboard.write(text);
			return;
		} catch (err) {
			console.error('Failed to copy with navigator.clipboard', err);
		}
	}
	// Fallback to `execCommand`
	const textarea = document.createElement('textarea');
	Object.assign(textarea.style, { position: 'fixed', top: '0', left: '0', opacity: '0' });
	textarea.value = text;
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	let success = false;
	try {
		success = document.execCommand('copy');
	} catch (err) {
		console.error('Failed to copy with execCommand.', err);
	} finally {
		document.body.removeChild(textarea);
	}
	if (!success) {
		throw new Error('Failed to copy text');
	}
}

export function openInGame(units: ArmyUnit[], ccUnits: ArmyUnit[], equipment: ArmyEquipment[], pets: ArmyPet[]) {
	const link = generateLink(units, ccUnits, equipment, pets);
	openLink(link);
}

export function getTags(army: Army) {
	const tags: { label: string; icon?: Component }[] = [];
	tags.push({ label: `TH${army.townHall}` });
	const typeData = army.units.reduce(
		(prev, curr) => {
			if (curr.type === 'Spell') {
				return prev;
			}
			if (curr.isFlying) {
				prev.air += curr.amount;
			} else {
				prev.ground += curr.amount;
			}
			return prev;
		},
		{ air: 0, ground: 0 }
	);
	tags.push({ label: typeData.ground > typeData.air ? 'Ground' : 'Air' });
	const hasClanCastle = army.units.filter((unit) => unit.home === 'clanCastle').length > 0;
	if (hasClanCastle) {
		tags.push({ label: 'Clan castle', icon: C.IconTagsClanCastle });
	}
	const hasHeroes = VALID_HEROES.some((hero) => hasHero(hero, army));
	if (hasHeroes) {
		tags.push({ label: 'Heroes', icon: C.IconTagsHeroes });
	}
	if (army.guide?.id) {
		tags.push({ label: 'Guide' });
	}
	return tags;
}

export function getCopyBtnTitle(units: ArmyUnit[]) {
	if (units.length) {
		return "Copies an army link to your clipboard for sharing.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be shared when empty';
}

export function getOpenBtnTitle(units: ArmyUnit[]) {
	if (units.length) {
		return "Opens clash of clans and allows you to paste your army in one of your slots.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be opened in-game when empty';
}
