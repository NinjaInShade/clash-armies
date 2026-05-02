/**
 * Zod schema for `game-data.json5`.
 * Validates structure and types for type-safety and to help with catching invalid data early.
 * Types are inferred - consumers can import `GameData` and the entity types from here.
 */
import { z } from 'zod';

// Primitives
const slugString = z.string().min(1);
const heroName = z.string().min(1);

// Entities
const HeroSchema = z.object({
	name: heroName,
	clashId: z.number().int().nonnegative().nullable(),
});
const UnitLevelSchema = z.object({
	level: z.number().int().positive(),
	buildingLevel: z.number().int().positive().nullable(),
	laboratoryLevel: z.number().int().positive().nullable(),
});
const UnitSchema = z.object({
	name: slugString,
	clashId: z.number().int().nonnegative().nullable(),
	productionBuilding: z.string().min(1),
	housingSpace: z.number().int().nonnegative(),
	isSuper: z.boolean(),
	isFlying: z.boolean(),
	isJumper: z.boolean(),
	airTargets: z.boolean(),
	groundTargets: z.boolean(),
	levels: z.array(UnitLevelSchema).min(1),
});
const PetLevelSchema = z.object({
	level: z.number().int().positive(),
	petHouseLevel: z.number().int().positive().nullable(),
});
const PetSchema = z.object({
	name: slugString,
	clashId: z.number().int().nonnegative().nullable(),
	levels: z.array(PetLevelSchema).min(1),
});
const EquipmentLevelSchema = z.object({
	level: z.number().int().positive(),
	blacksmithLevel: z.number().int().positive().nullable(),
});
const EquipmentSchema = z.object({
	name: slugString,
	hero: heroName,
	epic: z.boolean(),
	clashId: z.number().int().nonnegative().nullable(),
	levels: z.array(EquipmentLevelSchema).min(1),
});
const TownHallHeroMaxSchema = z.object({
	hero: heroName,
	maxLevel: z.number().int().positive(),
});
const TownHallSchema = z.object({
	level: z.number().int().positive(),
	maxBarracks: z.number().int().positive().nullable(),
	maxDarkBarracks: z.number().int().positive().nullable(),
	maxLaboratory: z.number().int().positive().nullable(),
	maxSpellFactory: z.number().int().positive().nullable(),
	maxDarkSpellFactory: z.number().int().positive().nullable(),
	maxWorkshop: z.number().int().positive().nullable(),
	maxCc: z.number().int().positive().nullable(),
	maxBlacksmith: z.number().int().positive().nullable(),
	maxPetHouse: z.number().int().positive().nullable(),
	troopCapacity: z.number().int().nonnegative(),
	spellCapacity: z.number().int().nonnegative(),
	siegeCapacity: z.number().int().nonnegative(),
	ccLaboratoryCap: z.number().int().nonnegative(),
	ccTroopCapacity: z.number().int().nonnegative(),
	ccSpellCapacity: z.number().int().nonnegative(),
	ccSiegeCapacity: z.number().int().nonnegative(),
	// Accept null/missing as "no heroes".
	heroMaxLevels: z.optional(
		z
			.array(TownHallHeroMaxSchema)
			.nullable()
			.default([])
			.transform((v) => v ?? [])
	),
});

export const GameDataSchema = z.object({
	townHalls: z.array(TownHallSchema),
	heroes: z.array(HeroSchema),
	troops: z.array(UnitSchema),
	spells: z.array(UnitSchema),
	sieges: z.array(UnitSchema),
	pets: z.array(PetSchema),
	equipment: z.array(EquipmentSchema),
});

export type GameData = z.infer<typeof GameDataSchema>;
export type GameDataHero = z.infer<typeof HeroSchema>;
export type GameDataTownHall = z.infer<typeof TownHallSchema>;
export type GameDataUnit = z.infer<typeof UnitSchema>;
export type GameDataPet = z.infer<typeof PetSchema>;
export type GameDataEquipment = z.infer<typeof EquipmentSchema>;
