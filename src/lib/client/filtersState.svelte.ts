import { mkParamStore } from '$client/params.svelte';
import { ARMY_TAG_CODES, ARMY_TAGS_BY_CODE, type ArmyTag } from '$shared/utils';
import type { AppState, Unit, Equipment, Pet } from '$types';

export type PickUnit = (Unit & { pickType: 'unit' }) | (Equipment & { pickType: 'equipment' }) | (Pet & { pickType: 'pet' });

export type Filters = {
	townHall?: number;
	hasGuide?: true;
	attackType?: string;
	noSuperTroops?: true;
	noEpicEquipment?: true;
	hasClanCastle?: boolean;
	hasEquipment?: boolean;
	hasPets?: boolean;
	units?: PickUnit[];
	tags?: ArmyTag[];
};

export type FiltersState = ReturnType<typeof createFiltersState>;

/** Number of filters currently applied */
export function countActiveFilters(filters: Filters): number {
	return Object.values(filters).filter((v) => {
		if (Array.isArray(v)) {
			return v.length > 0;
		}
		return v !== undefined;
	}).length;
}

function serializeUnits(units: PickUnit[]): string {
	// This can be improved - right now *every* unit gets a prefix,
	// but we really only need to specify prefix once and group them (e.g. u1-u2-e5 -> u1-2e5)
	let encoded: string[] = [];
	for (const unit of units) {
		encoded.push(`${unit.pickType[0]}${unit.id}`);
	}
	return encoded.join('-');
}

function deserializeUnits(app: AppState, value: string | null): PickUnit[] {
	if (!value) {
		return [];
	}
	const split = value.split('-');
	const units: PickUnit[] = [];
	for (const part of split) {
		const pickType = part[0];
		const id = +part.substring(1);
		let found: PickUnit | undefined;
		if (pickType === 'u') {
			const _found = app.units.find((u) => u.id === id);
			if (_found) {
				found = { pickType: 'unit', ..._found };
			}
		} else if (pickType === 'e') {
			const _found = app.equipment.find((u) => u.id === id);
			if (_found) {
				found = { pickType: 'equipment', ..._found };
			}
		} else if (pickType === 'p') {
			const _found = app.pets.find((u) => u.id === id);
			if (_found) {
				found = { pickType: 'pet', ..._found };
			}
		}
		if (found) {
			units.push(found);
		}
	}
	return units;
}

function serializeTags(tags: ArmyTag[]): string {
	return tags
		.map((tag) => ARMY_TAG_CODES[tag])
		.filter(Boolean)
		.join('-');
}

function deserializeTags(value: string | undefined): ArmyTag[] {
	if (!value) {
		return [];
	}
	return value
		.split('-')
		.map((code) => ARMY_TAGS_BY_CODE[code])
		.filter((tag): tag is ArmyTag => Boolean(tag));
}

/**
 * Manages the army list filters (as URL search params), so interested components
 * read/write the exact same reactive source instead of keeping two copies in sync.
 */
export function createFiltersState(app: AppState, pageParam = 'page') {
	// Changing any filter resets pagination back to page 1, since the current page may no longer exist
	const resetsPage = { resetKeys: [pageParam] };

	const townHall = mkParamStore('townHall', 'number', resetsPage);
	const hasGuide = mkParamStore('hasGuide', 'boolean', resetsPage);
	const attackType = mkParamStore('attackType', 'string', resetsPage);
	const hasClanCastle = mkParamStore('hasClanCastle', 'boolean', resetsPage);
	const hasEquipment = mkParamStore('hasEquipment', 'boolean', resetsPage);
	const units = mkParamStore<PickUnit[]>(
		'units',
		'custom',
		{
			serialize: serializeUnits,
			deserialize: (value) => deserializeUnits(app, value ?? null),
		},
		resetsPage
	);
	const noSuperTroops = mkParamStore('noSuperTroops', 'boolean', resetsPage);
	const noEpicEquipment = mkParamStore('noEpicEquipment', 'boolean', resetsPage);
	const hasPets = mkParamStore('hasPets', 'boolean', resetsPage);
	const tags = mkParamStore<ArmyTag[]>(
		'tags',
		'custom',
		{
			serialize: serializeTags,
			deserialize: deserializeTags,
		},
		resetsPage
	);

	const filters = $derived<Filters>({
		townHall: townHall.value,
		hasGuide: hasGuide.value ? true : undefined,
		attackType: attackType.value,
		noSuperTroops: noSuperTroops.value ? true : undefined,
		noEpicEquipment: noEpicEquipment.value ? true : undefined,
		hasClanCastle: hasClanCastle.value,
		hasEquipment: hasEquipment.value,
		hasPets: hasPets.value,
		units: units.value,
		tags: tags.value,
	});
	const count = $derived(countActiveFilters(filters));

	function setTownHall(value?: number) {
		townHall.value = value;
	}

	function setHasGuide(value?: boolean) {
		hasGuide.value = value ? true : undefined;
	}

	function setAttackType(value?: string) {
		attackType.value = value;
	}

	function setHasClanCastle(value?: boolean) {
		hasClanCastle.value = value;
	}

	function setHasEquipment(value?: boolean) {
		hasEquipment.value = value;
	}

	function setUnits(newUnits: PickUnit[]) {
		units.value = newUnits;
	}

	function addUnit(unit: PickUnit) {
		const currUnits = units.value ?? [];
		setUnits([...currUnits, unit]);
	}

	function removeUnit(unit: PickUnit) {
		const currUnits = units.value ?? [];
		setUnits(currUnits.filter((u) => !(u.name === unit.name && u.pickType === unit.pickType)));
	}

	function toggleTag(tag: ArmyTag) {
		const currTags = tags.value ?? [];
		const nextTags = currTags.includes(tag) ? currTags.filter((t) => t !== tag) : [...currTags, tag];
		tags.value = nextTags;
	}

	async function setNoSuperTroops(value?: boolean) {
		const currUnits = units.value ?? [];
		const selectedSuperTroops = currUnits.filter((u) => u.pickType === 'unit' && u.isSuper).length > 0;
		if (value === true && selectedSuperTroops) {
			const confirmed = await app.confirm('You are filtering by one or more super troops, this will clear those. Select anyway?');
			if (!confirmed) return;
			units.value = currUnits.filter((u) => u.pickType !== 'unit' || !u.isSuper);
		}
		noSuperTroops.value = value ? true : undefined;
	}

	async function setNoEpicEquipment(value?: boolean) {
		const currUnits = units.value ?? [];
		const selectedEpicEquipment = currUnits.filter((u) => u.pickType === 'equipment' && u.epic).length > 0;
		if (value === true && selectedEpicEquipment) {
			const confirmed = await app.confirm('You are filtering by one or more epic equipment, this will clear those. Select anyway?');
			if (!confirmed) return;
			units.value = currUnits.filter((u) => u.pickType !== 'equipment' || !u.epic);
		}
		noEpicEquipment.value = value ? true : undefined;
	}

	async function setHasPets(value?: boolean) {
		const currUnits = units.value ?? [];
		const selectedPets = currUnits.filter((u) => u.pickType === 'pet').length > 0;
		if (value === false && selectedPets) {
			const confirmed = await app.confirm('You are filtering by one or more pets, this will clear those. Select anyway?');
			if (!confirmed) return;
			units.value = currUnits.filter((u) => u.pickType !== 'pet');
		}
		hasPets.value = value;
	}

	function resetAllFilters() {
		townHall.value = undefined;
		hasGuide.value = undefined;
		attackType.value = undefined;
		noSuperTroops.value = undefined;
		noEpicEquipment.value = undefined;
		hasClanCastle.value = undefined;
		hasEquipment.value = undefined;
		hasPets.value = undefined;
		units.value = [];
		tags.value = [];
	}

	return {
		get value() {
			return filters;
		},
		get count() {
			return count;
		},
		setTownHall,
		setHasGuide,
		setAttackType,
		setHasClanCastle,
		setHasEquipment,
		setNoSuperTroops,
		setNoEpicEquipment,
		setHasPets,
		addUnit,
		removeUnit,
		setUnits,
		toggleTag,
		resetAllFilters,
	};
}
