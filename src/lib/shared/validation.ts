import type { HeroType, StaticGameData } from '$types';
import { BANNERS, VALID_UNIT_HOME, VALID_HEROES, GUIDE_TEXT_CHAR_LIMIT, YOUTUBE_URL_REGEX, MAX_COMMENT_LENGTH, MAX_ARMY_TAGS, ARMY_TAGS } from './utils';
import { ArmyModel, UnitModel, PetModel, EquipmentModel, GuideModel } from '$models';
import { parseHTML } from 'zeed-dom';
import z from 'zod';

export const numberSchema = z.number().int().positive();
export const unitSchema = z.object({
	id: numberSchema.optional(),
	unitId: numberSchema,
	home: z.enum(VALID_UNIT_HOME),
	amount: numberSchema,
});
export const equipmentSchema = z.object({
	id: numberSchema.optional(),
	equipmentId: numberSchema,
});
export const petSchema = z.object({
	id: numberSchema.optional(),
	petId: numberSchema,
	hero: z.enum(VALID_HEROES),
});
export const guideSchema = z.object({
	id: numberSchema.optional(),
	textContent: z.string().nullable(),
	youtubeUrl: z.string().nullable(),
});
export const armySchema = z.object({
	id: numberSchema.optional(),
	name: z.string().min(2).max(25),
	townHall: numberSchema,
	banner: z.enum(BANNERS),
	units: z.array(unitSchema).nonempty(),
	equipment: z.array(equipmentSchema),
	pets: z.array(petSchema),
	tags: z.array(z.enum(ARMY_TAGS)).max(MAX_ARMY_TAGS),
	guide: guideSchema.nullable(),
});

export const commentSchema = z.object({
	id: numberSchema.optional(),
	armyId: numberSchema,
	comment: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
	replyTo: numberSchema.nullable(),
});

/**
 * Validates data for a saved or unsaved army, returning a validated, ready for saving to the db, `ArmyModel`, if successful.
 * Also validates business logic rules such as making sure units are unlocked for the town hall etc...
 */
export function validateArmy(data: unknown, gameData: StaticGameData): ArmyModel {
	const army = armySchema.parse(data);
	const model = new ArmyModel(gameData, army);

	const heroesUsed = VALID_HEROES.filter((hero) => hasHero(hero, model)).length;
	if (heroesUsed > 4) {
		throw new Error('Cannot use more than 4 heroes');
	}

	validateUnits(model);
	validateCcUnits(model);
	validateEquipment(model);
	validatePets(model);
	if (model.guide) {
		validateGuide(model.guide);
	}

	return model;
}

export function validateUnits(model: ArmyModel) {
	const { units, housingSpaceUsed, thData } = model;

	// Check for duplicate units
	const duplicateUnits = findDuplicateUnits(units);
	if (duplicateUnits.length) {
		const unitData = UnitModel.require(duplicateUnits[0], model.gameData);
		throw new Error(`Duplicate unit "${unitData.name}" found`);
	}

	// Check totals don't overflow max town hall capacity
	if (housingSpaceUsed.troops > thData.troopCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max troop capacity of ${thData.troopCapacity}, but this army exceeded that with ${housingSpaceUsed.troops}`
		);
	}
	if (housingSpaceUsed.spells > thData.spellCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max spell capacity of ${thData.spellCapacity}, but this army exceeded that with ${housingSpaceUsed.spells}`
		);
	}
	if (housingSpaceUsed.sieges > thData.siegeCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max siege machine capacity of ${thData.siegeCapacity}, but this army exceeded that with ${housingSpaceUsed.sieges}`
		);
	}

	// Check we haven't exceeded the super limit (max 2 unique super troops per army)
	if (units.filter((u) => u.info.isSuper).length > 2) {
		throw new Error(`An army can have a maximum of two unique super troops`);
	}

	// Check units can all be selected
	for (const unit of units) {
		if (UnitModel.getMaxLevel(unit.info, model.townHall, model.gameData) === -1) {
			throw new Error(`Unit "${unit.info.name}" isn't available at town hall ${model.townHall}`);
		}
	}
}

export function validateCcUnits(model: ArmyModel) {
	const { ccUnits, ccHousingSpaceUsed, thData } = model;

	// Check for duplicate clan castle units
	const duplicateCcUnits = findDuplicateUnits(ccUnits);
	if (duplicateCcUnits.length) {
		const unitData = UnitModel.require(duplicateCcUnits[0], model.gameData);
		throw new Error(`Duplicate clan castle unit "${unitData.name}" found`);
	}

	// Check clan castle totals don't overflow max town hall cc capacity
	if (ccHousingSpaceUsed.troops > thData.ccTroopCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle troop capacity of ${thData.ccTroopCapacity}, but this army exceeded that with ${ccHousingSpaceUsed.troops}`
		);
	}
	if (ccHousingSpaceUsed.spells > thData.ccSpellCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle spell capacity of ${thData.ccSpellCapacity}, but this army exceeded that with ${ccHousingSpaceUsed.spells}`
		);
	}
	if (ccHousingSpaceUsed.sieges > thData.ccSiegeCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle siege machine capacity of ${thData.ccSiegeCapacity}, but this army exceeded that with ${ccHousingSpaceUsed.sieges}`
		);
	}

	// Check clan castle units can all be selected
	for (const unit of ccUnits) {
		if (UnitModel.getMaxCcLevel(unit.info, model.townHall, model.gameData) === -1) {
			throw new Error(`Clan castle unit "${unit.info.name}" isn't available at town hall ${model.townHall}`);
		}
	}
}

export function validateEquipment(model: ArmyModel) {
	const heroToEquipment: Record<string, string[]> = {};

	for (const eq of model.equipment) {
		const hero = eq.info.hero.toLowerCase();
		const stashedEquipment = heroToEquipment[eq.info.hero] ?? [];
		if (stashedEquipment.includes(eq.info.name)) {
			throw new Error(`Duplicate equipment "${eq.info.name}" on ${hero}`);
		}
		if (stashedEquipment.length === 2) {
			throw new Error(`Hero ${hero} cannot have more than two pieces of equipment`);
		}
		if (ArmyModel.getMaxHeroLevel(eq.info.hero, model.townHall, model.gameData) === -1) {
			throw new Error(`Equipment "${eq.info.name}" can't be used as the ${hero} isn't unlocked at town hall ${model.townHall}`);
		}
		if (EquipmentModel.getMaxLevel(eq.info.name, model.townHall, model.gameData) === -1) {
			throw new Error(`Equipment "${eq.info.name}" isn't available at town hall ${model.townHall}`);
		}
		heroToEquipment[eq.info.hero] = [...stashedEquipment, eq.info.name];
	}
}

export function validatePets(model: ArmyModel) {
	const heroToPets: Record<string, string[]> = {};

	for (const pet of model.pets) {
		const hero = pet.hero.toLowerCase();
		const stashedPets = heroToPets[pet.hero] ?? [];
		if (stashedPets.length === 1) {
			throw new Error(`Hero ${hero} cannot have more than one pet`);
		}
		if (
			Object.values(heroToPets)
				.flatMap((p) => p)
				.includes(pet.info.name)
		) {
			throw new Error(`Pet "${pet.info.name}" has already been assigned to another hero`);
		}
		if (ArmyModel.getMaxHeroLevel(pet.hero, model.townHall, model.gameData) === -1) {
			throw new Error(`Pet "${pet.info.name}" can't be used as the ${hero} isn't unlocked at town hall ${model.townHall}`);
		}
		if (PetModel.getMaxLevel(pet.info.name, model.townHall, model.gameData) === -1) {
			throw new Error(`Pet "${pet.info.name}" isn't available at town hall ${model.townHall}`);
		}
		heroToPets[pet.hero] = [...stashedPets, pet.info.name];
	}
}

function validateGuide(guide: GuideModel) {
	const { textContent, youtubeUrl } = guide;

	if (!textContent && !youtubeUrl) {
		throw new Error('Guide must have at least either text content or YouTube video URL');
	}

	if (typeof textContent === 'string') {
		// TODO: find a client/server compatible way to make this error if the schema is invalid
		// Right now this doesn't work as invalid tags/text gets stripped by generateJSON instead of leaving it so .check() never throws
		// const extensions = getExtensions();
		// const json = generateJSON(textContent, extensions);
		// const schema = getSchema(extensions);
		// schema.nodeFromJSON(json).check();

		const doc = parseHTML(textContent);
		const charsLength = GuideModel.countCharacters(doc);

		// Validate not over the char limit
		if (charsLength > GUIDE_TEXT_CHAR_LIMIT) {
			throw new Error('Guide text content exceeded the character limit');
		}
	}

	if (typeof youtubeUrl === 'string' && !YOUTUBE_URL_REGEX.test(youtubeUrl)) {
		throw new Error('Guide has an invalid YouTube URL');
	}
}

function findDuplicateUnits(units: UnitModel[]) {
	const seen = new Set<number>();
	const duplicates = new Set<number>();
	for (const obj of units) {
		if (seen.has(obj.unitId)) {
			duplicates.add(obj.unitId);
		} else {
			seen.add(obj.unitId);
		}
	}
	return Array.from(duplicates);
}

/**
 * Achieves the same function as the shared `hasHero` that takes in a fully saved `Army` type.
 * Unlike that function, this one can take in a `SaveArmy` so useful for validating a new/edited army.
 */
export function hasHero(hero: HeroType, model: ArmyModel) {
	for (const equipment of model.equipment) {
		if (equipment.info.hero === hero) {
			return hero;
		}
	}
	for (const pet of model.pets) {
		if (pet.hero === hero) {
			return true;
		}
	}
	return false;
}
