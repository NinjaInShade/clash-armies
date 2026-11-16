/**
 * Zod schema for `game-data.json5`.
 * Validates structure and types for type-safety and to help with catching invalid data early.
 * Types are inferred - consumers can import `GameData` and the entity types from here.
 */
import { z } from 'zod';
import { SQUAD_BARRACKS } from '#shared/gameData.ts';

// Primitives
const slugString = z.string().min(1);
const heroName = z.string().min(1);

// Entities
const HeroSchema = z.object({
	name: heroName,
	clashId: z.int().nonnegative().nullable(),
});
const UnitLevelSchema = z.object({
	level: z.int().positive(),
	buildingLevel: z.int().positive().nullable(),
	laboratoryLevel: z.int().positive().nullable(),
	/**
	 * Housing space from this level onwards, when it differs from the unit's base `housingSpace` (e.g. some squads get smaller).
	 *
	 * Omit to inherit from the previous level.
	 */
	housingSpace: z.int().positive().optional(),
});
const SquadMemberSchema = z.object({
	troop: slugString,
	amount: z.int().positive(),
});
const UnitSchema = z.object({
	name: slugString,
	clashId: z.int().nonnegative().nullable(),
	productionBuilding: z.string().min(1),
	housingSpace: z.int().nonnegative(),
	isSuper: z.boolean(),
	isFlying: z.boolean(),
	isJumper: z.boolean(),
	airTargets: z.boolean(),
	groundTargets: z.boolean(),
	/**
	 * The troops a squad is made up of - present only for squads.
	 */
	squadMembers: z.array(SquadMemberSchema).min(1).optional(),
	levels: z.array(UnitLevelSchema).min(1),
});
const PetLevelSchema = z.object({
	level: z.int().positive(),
	petHouseLevel: z.int().positive().nullable(),
});
const PetSchema = z.object({
	name: slugString,
	clashId: z.int().nonnegative().nullable(),
	levels: z.array(PetLevelSchema).min(1),
});
const EquipmentLevelSchema = z.object({
	level: z.int().positive(),
	blacksmithLevel: z.int().positive().nullable(),
});
const EquipmentSchema = z.object({
	name: slugString,
	hero: heroName,
	epic: z.boolean(),
	clashId: z.int().nonnegative().nullable(),
	levels: z.array(EquipmentLevelSchema).min(1),
});
const TownHallHeroMaxSchema = z.object({
	hero: heroName,
	maxLevel: z.int().positive(),
});
const TownHallSchema = z.object({
	level: z.int().positive(),
	maxBarracks: z.int().positive().nullable(),
	maxDarkBarracks: z.int().positive().nullable(),
	maxLaboratory: z.int().positive().nullable(),
	maxSpellFactory: z.int().positive().nullable(),
	maxDarkSpellFactory: z.int().positive().nullable(),
	maxWorkshop: z.int().positive().nullable(),
	maxCc: z.int().positive().nullable(),
	maxBlacksmith: z.int().positive().nullable(),
	maxPetHouse: z.int().positive().nullable(),
	maxSquadBarracks: z.int().positive().nullable(),
	troopCapacity: z.int().nonnegative(),
	spellCapacity: z.int().nonnegative(),
	siegeCapacity: z.int().nonnegative(),
	ccLaboratoryCap: z.int().nonnegative(),
	ccTroopCapacity: z.int().nonnegative(),
	ccSpellCapacity: z.int().nonnegative(),
	ccSiegeCapacity: z.int().nonnegative(),
	heroSlots: z.int().nonnegative(),
	// Accept null/missing as "no heroes".
	heroMaxLevels: z.optional(
		z
			.array(TownHallHeroMaxSchema)
			.nullable()
			.default([])
			.transform((v) => v ?? [])
	),
});

export const GameDataSchema = z
	.object({
		townHalls: z.array(TownHallSchema),
		heroes: z.array(HeroSchema),
		troops: z.array(UnitSchema),
		spells: z.array(UnitSchema),
		sieges: z.array(UnitSchema),
		pets: z.array(PetSchema),
		equipment: z.array(EquipmentSchema),
	})
	.superRefine((data, ctx) => {
		// Squads can only be troops, and are made up of regular (non-squad) troops
		const regularTroops = new Set(data.troops.filter((t) => !t.squadMembers).map((t) => t.name));
		for (const [key, units] of [
			['spells', data.spells],
			['sieges', data.sieges],
		] as const) {
			units.forEach((unit, idx) => {
				if (unit.squadMembers) {
					ctx.addIssue({ code: 'custom', path: [key, idx, 'squadMembers'], message: `"${unit.name}" cannot be a squad - only troops can` });
				}
			});
		}
		data.troops.forEach((troop, idx) => {
			const isSquadBuilding = troop.productionBuilding === SQUAD_BARRACKS;
			if (isSquadBuilding !== Boolean(troop.squadMembers)) {
				ctx.addIssue({
					code: 'custom',
					path: ['troops', idx],
					message: `"${troop.name}" must have both squad members and the "${SQUAD_BARRACKS}" production building, or neither`,
				});
			}
			if (!troop.squadMembers) {
				return;
			}

			const seen = new Set<string>();
			troop.squadMembers.forEach((member, memberIdx) => {
				const path = ['troops', idx, 'squadMembers', memberIdx, 'troop'];
				if (!regularTroops.has(member.troop)) {
					ctx.addIssue({ code: 'custom', path, message: `Squad "${troop.name}" member "${member.troop}" isn't a regular troop` });
				}
				if (seen.has(member.troop)) {
					ctx.addIssue({ code: 'custom', path, message: `Squad "${troop.name}" has duplicate member "${member.troop}"` });
				}
				seen.add(member.troop);
			});
		});
	});

export type GameData = z.infer<typeof GameDataSchema>;
export type GameDataHero = z.infer<typeof HeroSchema>;
export type GameDataTownHall = z.infer<typeof TownHallSchema>;
export type GameDataUnit = z.infer<typeof UnitSchema>;
export type GameDataSquadMember = z.infer<typeof SquadMemberSchema>;
export type GameDataPet = z.infer<typeof PetSchema>;
export type GameDataEquipment = z.infer<typeof EquipmentSchema>;
