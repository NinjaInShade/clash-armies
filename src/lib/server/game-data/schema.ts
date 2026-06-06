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
	clashId: z.int().nonnegative().nullable(),
});
const UnitLevelSchema = z.object({
	level: z.int().positive(),
	buildingLevel: z.int().positive().nullable(),
	laboratoryLevel: z.int().positive().nullable(),
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
	troopCapacity: z.int().nonnegative(),
	spellCapacity: z.int().nonnegative(),
	siegeCapacity: z.int().nonnegative(),
	ccLaboratoryCap: z.int().nonnegative(),
	ccTroopCapacity: z.int().nonnegative(),
	ccSpellCapacity: z.int().nonnegative(),
	ccSiegeCapacity: z.int().nonnegative(),
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
