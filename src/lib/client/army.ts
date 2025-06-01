import type { AppState, StaticGameData, UnitHome } from '$types';
import type { Component } from 'svelte';
import { HERO_CLASH_IDS, COPY_LINK_CLICK_METRIC, OPEN_LINK_CLICK_METRIC } from '$shared/utils';
import { validateArmy } from '$shared/validation';
import { ArmyModel, UnitModel, PetModel, EquipmentModel } from '$models';

/**
 * Generates URL link to copy army into clash of clans.
 *
 * Example: https://link.clashofclans.com/en?action=CopyArmy&army=u10x0-2x3s1x9-3x2
 */
export function generateLink(army: ArmyModel): string {
	function buildUnitStr(units: UnitModel[]) {
		return units
			.reduce<string[]>((prev, unit) => {
				const troopString = `${unit.amount}x${+unit.info.clashId}`;
				prev.push(troopString);
				return prev;
			}, [])
			.join('-');
	}
	function buildHeroesStr(heroes: Record<string, { pet?: PetModel; eq1?: EquipmentModel; eq2?: EquipmentModel }>) {
		return Object.entries(heroes)
			.reduce<string[]>((prev, [name, hero]) => {
				const clashId = HERO_CLASH_IDS[name];
				let heroStr = clashId;
				if (hero.pet) {
					heroStr += `p${hero.pet.info.clashId}`;
				}
				if (hero.eq1 || hero.eq2) {
					const firstEq = hero.eq1 || hero.eq2;
					const secondEq = firstEq === hero.eq1 ? hero.eq2 : hero.eq1;
					heroStr += `e${firstEq?.info.clashId}`;
					if (secondEq) {
						heroStr += `_${secondEq.info.clashId}`;
					}
				}
				prev.push(heroStr);
				return prev;
			}, [])
			.join('-');
	}

	let url = 'https://link.clashofclans.com/?action=CopyArmy&army=';

	const selectedTroops = army.units.filter((item) => item.info.type === 'Troop' || item.info.type === 'Siege');
	const selectedSpells = army.units.filter((item) => item.info.type === 'Spell');
	const selectedCCTroops = army.ccUnits.filter((item) => item.info.type === 'Troop' || item.info.type === 'Siege');
	const selectedCCSpells = army.ccUnits.filter((item) => item.info.type === 'Spell');
	const heroes: Record<string, { pet?: PetModel; eq1?: EquipmentModel; eq2?: EquipmentModel }> = {};

	for (const eq of army.equipment) {
		const hero = eq.info.hero;
		if (!(hero in heroes)) {
			heroes[hero] = {};
		}
		if (!heroes[hero].eq1) {
			heroes[hero].eq1 = eq;
		} else if (!heroes[hero].eq2) {
			heroes[hero].eq2 = eq;
		}
	}
	for (const pet of army.pets) {
		if (!(pet.hero in heroes)) {
			heroes[pet.hero] = {};
		} else if (!heroes[pet.hero].pet) {
			heroes[pet.hero].pet = pet;
		}
	}

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
export function parseLink(fullLink: string, gameData: StaticGameData) {
	const url = new URL(fullLink);
	const link = url.searchParams.get('army');
	if (!link) {
		throw new Error(`Import link "${fullLink}" is invalid`);
	}

	const model = new ArmyModel(gameData);

	function parseUnits(data: string) {
		return data
			.split('-')
			.filter(Boolean)
			.map((item) => {
				const [amount, id] = item.split('x').map(Number);
				return { id, amount };
			});
	}

	function addUnit(data: { id: number; amount: number }, type: 'Troop' | 'Spell', housedIn: UnitHome) {
		if (type === 'Troop') {
			const unit = UnitModel.requireTroopByClashID(data.id, gameData);
			const modelUnit = model.addUnit(unit, housedIn);
			modelUnit.amount = data.amount;
		} else if (type === 'Spell') {
			const unit = UnitModel.requireSpellByClashID(data.id, gameData);
			const modelUnit = model.addUnit(unit, housedIn);
			modelUnit.amount = data.amount;
		}
	}

	for (const match of link.matchAll(ARMY_LINK_SEPARATOR)) {
		if (match.groups?.heroes) {
			for (const hero of match.groups.heroes.split('-').filter(Boolean)) {
				const m = ARMY_LINK_HERO_PATTERN.exec(hero);
				const groups = m?.groups;
				if (groups) {
					const heroName = Object.entries(HERO_CLASH_IDS).find(([name, id]) => id === parseInt(groups.hero_id, 10))?.[0];
					if (!heroName) {
						throw new Error('Invalid hero ID');
					}
					if (groups.pet_id) {
						const pet = PetModel.requireByClashID(parseInt(groups.pet_id, 10), gameData);
						model.addPet(pet, heroName);
					}
					if (groups.eq1) {
						const eq = EquipmentModel.requireByClashID(parseInt(groups.eq1, 10), gameData);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						model.addEquipment(eq);
					}
					if (groups.eq2) {
						const eq = EquipmentModel.requireByClashID(parseInt(groups.eq2, 10), gameData);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						model.addEquipment(eq);
					}
				}
				// Reset lastIndex of regex otherwise you get random `null` results from the `exec`.
				ARMY_LINK_HERO_PATTERN.lastIndex = 0;
			}
		} else if (match.groups?.castle_units) {
			parseUnits(match.groups.castle_units).forEach((unit) => addUnit(unit, 'Troop', 'clanCastle'));
		} else if (match.groups?.castle_spells) {
			parseUnits(match.groups.castle_spells).forEach((unit) => addUnit(unit, 'Spell', 'clanCastle'));
		} else if (match.groups?.units) {
			parseUnits(match.groups.units).forEach((unit) => addUnit(unit, 'Troop', 'armyCamp'));
		} else if (match.groups?.spells) {
			parseUnits(match.groups.spells).forEach((unit) => addUnit(unit, 'Spell', 'armyCamp'));
		}
	}

	// TODO: support multiple CCs in armies
	const firstSiege = model.units.find((u) => u.info.type === 'Siege');
	if (firstSiege) {
		model.units = model.units.filter((u) => u.info.type !== 'Siege' || u === firstSiege);
		firstSiege.amount = 1;
	}

	// Ensure imported data is valid
	const modelData = model.getSaveData();

	// TODO: validateArmy() validates *everything* whereas here we only care
	// about certain things like units, so we end up having to "stub" some properties
	modelData.name = 'stub';

	validateArmy(modelData, gameData);

	return model;
}

export function openLink(href: string, openInNewTab = true) {
	window.open(href, openInNewTab ? '_blank' : undefined, 'rel="noreferrer"');
}

export async function copy(text: string) {
	if ('navigator' in window && window.navigator.clipboard) {
		try {
			const data = { 'text/plain': text };
			const clipboardItem = new ClipboardItem(data);
			await navigator.clipboard.write([clipboardItem]);
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
	const prevFocused = document.activeElement;
	textarea.focus();
	textarea.select();
	let success = false;
	try {
		success = document.execCommand('copy');
	} catch (err) {
		console.error('Failed to copy with execCommand.', err);
	} finally {
		document.body.removeChild(textarea);
		if (prevFocused instanceof HTMLElement) {
			prevFocused.focus();
		}
	}
	if (!success) {
		throw new Error('Failed to copy text');
	}
}

export async function copyLink(army: ArmyModel, app: AppState) {
	app.http.post('/api/armies/metrics', { metric: COPY_LINK_CLICK_METRIC, armyId: army.id }).catch(() => {});
	const link = generateLink(army);
	await copy(link);
	app.notify({ title: 'Copied army!', description: 'Successfully copied army link to clipboard', theme: 'success' });
}

export function openInGame(army: ArmyModel, app: AppState) {
	app.http.post('/api/armies/metrics', { metric: OPEN_LINK_CLICK_METRIC, armyId: army.id }).catch(() => {});
	const link = generateLink(army);
	openLink(link);
}

export function getTags(army: ArmyModel) {
	const armyStats = army.getStats();
	const tags: { label: string; icon?: Component }[] = [];
	tags.push({ label: `TH${army.townHall}` });
	tags.push({ label: armyStats.type });
	if (armyStats.hasGuide) {
		tags.push({ label: 'Guide' });
	}
	for (const tag of army.tags) {
		tags.push({ label: tag });
	}
	return tags;
}

export function getCopyBtnTitle(army: ArmyModel) {
	if (army.units.length || army.ccUnits.length || army.pets.length || army.equipment.length) {
		return "Copies an army link to your clipboard for sharing.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be shared when empty';
}

export function getOpenBtnTitle(army: ArmyModel) {
	if (army.units.length || army.ccUnits.length || army.pets.length || army.equipment.length) {
		return "Opens clash of clans and allows you to paste your army in one of your slots.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be opened in-game when empty';
}
