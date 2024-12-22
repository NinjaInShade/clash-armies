import type { AppState, Army, Unit, ArmyUnit, Optional } from '$types';
import type { Component } from 'svelte';
import { SECOND, MINUTE, HOUR, OBJECT_ID_PREFIXES, VALID_HEROES, hasHero } from '$shared/utils';
import C from '$components';

/**
 * Generates URL link to copy army into clash of clans.
 *
 * Example: https://link.clashofclans.com/en?action=CopyArmy&army=u10x0-2x3s1x9-3x2
 *
 * First are troops, prefixed with the "u" character):
 * - First item is 10 troops with id 0, which are Barbarians.
 * - Next item is 2 troops with id 3, which are Giants.
 *
 * Then come the spells (starting with the s character):
 * - First is 1 spell with id 9, which is a Poison Spell.
 * - Second is 3 spells with id 2, which is a Rage Spell.
 */
export function generateLink(units: ArmyUnit[]): string {
	let url = 'https://link.clashofclans.com/?action=CopyArmy&army=';

	const selectedTroops = units.filter((item) => item.type === 'Troop' || item.type === 'Siege');
	const selectedSpells = units.filter((item) => item.type === 'Spell');

	// generate troops
	if (selectedTroops.length) {
		url += 'u';
		url += selectedTroops
			.reduce<string[]>((prev, troop) => {
				const id = String(troop.objectId).slice(String(OBJECT_ID_PREFIXES.Characters).length);
				const troopString = `${troop.amount}x${+id}`;
				prev.push(troopString);
				return prev;
			}, [])
			.join('-');
	}

	// generate spells
	if (selectedSpells.length) {
		url += 's';
		url += selectedSpells
			.reduce<string[]>((prev, spell) => {
				const id = String(spell.objectId).slice(String(OBJECT_ID_PREFIXES.Spells).length);
				const spellString = `${spell.amount}x${+id}`;
				prev.push(spellString);
				return prev;
			}, [])
			.join('-');
	}

	return url;
}

/**
 * Takes in a clash of clans army link and parses it into an array of selected items
 *
 * The army=querystring value can be parsed with regex into two groups (troops and spells):
 * - u([\d+x-]+)s([\d+x-]+)
 */
export function parseLink(link: string, ctx: { units: Unit[] }): Optional<ArmyUnit, 'id'>[] {
	const units: Optional<ArmyUnit, 'id'>[] = [];
	const parsedUnits = /u(?<troops>[\d+x-]+)s(?<spells>[\d+x-]+)/.exec(link);

	const troops = parsedUnits?.groups?.troops;
	const spells = parsedUnits?.groups?.spells;
	if (typeof troops !== 'string' || typeof spells !== 'string') {
		throw new Error('Invalid army link');
	}

	// parse troops/siege machine
	for (const troop of troops.split('-')) {
		const [amount, troopId] = troop.split('x');
		if (!amount || Number.isNaN(+amount)) {
			throw new Error('Invalid troop amount');
		}
		if (!troopId || Number.isNaN(+troopId)) {
			throw new Error('Invalid troop ID');
		}
		const appTroop = ctx.units.find((u) => {
			const objectId = String(u.objectId);
			const prefix = String(OBJECT_ID_PREFIXES.Characters);
			return objectId.startsWith(prefix) && +objectId.slice(prefix.length) === +troopId;
		});
		if (!appTroop) {
			throw new Error(`Troop with ID "${troopId}" couldn't be found`);
		}
		units.push({
			unitId: appTroop.id,
			home: 'armyCamp',
			amount: +amount,
			...appTroop,
			id: undefined,
		});
	}

	// parse spells
	for (const spell of spells.split('-')) {
		const [amount, spellId] = spell.split('x');
		if (!amount || Number.isNaN(+amount)) {
			throw new Error('Invalid spell amount');
		}
		if (!spellId || Number.isNaN(+spellId)) {
			throw new Error('Invalid spell ID');
		}
		const appSpell = ctx.units.find((u) => {
			const objectId = String(u.objectId);
			const prefix = String(OBJECT_ID_PREFIXES.Spells);
			return objectId.startsWith(prefix) && +objectId.slice(prefix.length) === +spellId;
		});
		if (!appSpell) {
			throw new Error(`Spell with ID "${spellId}" couldn't be found`);
		}
		units.push({
			unitId: appSpell.id,
			home: 'armyCamp',
			amount: +amount,
			...appSpell,
			id: undefined,
		});
	}

	return units;
}

export function openLink(href: string, openInNewTab = true) {
	window.open(href, openInNewTab ? '_blank' : undefined, 'rel="noreferrer"');
}

export async function copyLink(units: ArmyUnit[], app: AppState) {
	const link = generateLink(units);
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

export function openInGame(units: ArmyUnit[]) {
	const link = generateLink(units);
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

/**
 * @param time: the time to format in miliseconds
 * @returns formatted time string e.g. '1m 20s'
 */
export function formatTime(time: number) {
	const parts: string[] = [];

	if (time >= HOUR) {
		const hours = Math.floor(time / HOUR);
		parts.push(`${hours}h`);
		time -= hours * HOUR;
	}
	if (time >= MINUTE) {
		const mins = Math.floor(time / MINUTE);
		parts.push(`${mins}m`);
		time -= mins * MINUTE;
	}
	if (time >= SECOND) {
		const secs = Math.floor(time / SECOND);
		parts.push(`${secs}s`);
		time -= secs * SECOND;
	}
	if (time > 0) {
		throw new Error(`Unexpected time left over after formatting: "${time}"`);
	}

	return parts.length ? parts.join(' ') : '0s';
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
