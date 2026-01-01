import type { MySQL, MigrationFn } from '@ninjalib/sql';
import type { Unit, Pet } from '$types';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(47, `
        ALTER TABLE users
        ADD COLUMN createdTime TIMESTAMP DEFAULT NOW()
    `);
    runStep(48, `
        CREATE TABLE army_tags (
            armyId INT NOT NULL,
            tag VARCHAR(50) NOT NULL,
            PRIMARY KEY (armyId, tag),
            CONSTRAINT fk_army_tags_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE
        )
    `);
    runStep(49, async (db: MySQL) => {
		// Insert data for new "Dark Crown" equipment
		const equipmentId = await db.insertOne('equipment', {
			hero: 'Minion Prince',
			name: 'Dark Crown',
			epic: 1,
            clashId: 35,
		});
		// Insert levels
		await db.insertMany('equipment_levels', [
			{ equipmentId, level: 1, blacksmithLevel: 1 },
			{ equipmentId, level: 2, blacksmithLevel: 1 },
			{ equipmentId, level: 3, blacksmithLevel: 1 },
			{ equipmentId, level: 4, blacksmithLevel: 1 },
			{ equipmentId, level: 5, blacksmithLevel: 1 },
			{ equipmentId, level: 6, blacksmithLevel: 1 },
			{ equipmentId, level: 7, blacksmithLevel: 1 },
			{ equipmentId, level: 8, blacksmithLevel: 1 },
			{ equipmentId, level: 9, blacksmithLevel: 1 },
			{ equipmentId, level: 10, blacksmithLevel: 1 },
			{ equipmentId, level: 11, blacksmithLevel: 1 },
			{ equipmentId, level: 12, blacksmithLevel: 1 },
			{ equipmentId, level: 13, blacksmithLevel: 3 },
			{ equipmentId, level: 14, blacksmithLevel: 3 },
			{ equipmentId, level: 15, blacksmithLevel: 3 },
			{ equipmentId, level: 16, blacksmithLevel: 5 },
			{ equipmentId, level: 17, blacksmithLevel: 5 },
			{ equipmentId, level: 18, blacksmithLevel: 5 },
			{ equipmentId, level: 19, blacksmithLevel: 7 },
			{ equipmentId, level: 20, blacksmithLevel: 7 },
			{ equipmentId, level: 21, blacksmithLevel: 7 },
			{ equipmentId, level: 22, blacksmithLevel: 8 },
			{ equipmentId, level: 23, blacksmithLevel: 8 },
			{ equipmentId, level: 24, blacksmithLevel: 8 },
			{ equipmentId, level: 25, blacksmithLevel: 9 },
			{ equipmentId, level: 26, blacksmithLevel: 9 },
			{ equipmentId, level: 27, blacksmithLevel: 9 },
		]);
	});
	runStep(50, `
        UPDATE town_halls SET
            maxDarkSpellFactory = 7
        WHERE level >= 14
    `);
	runStep(51, async (db: MySQL) => {
		// Insert data for new "Ice Block" spell
        const spellId = await db.insertOne('units', {
            type: 'Spell',
            name: 'Ice Block',
            clashId: 109,
            housingSpace: 1,
            productionBuilding: 'Dark Spell Factory',
        });
        await db.insertMany('unit_levels', [
            { unitId: spellId, level: 1, spellFactoryLevel: 7, laboratoryLevel: 1 },
            { unitId: spellId, level: 2, spellFactoryLevel: 7, laboratoryLevel: 12 },
            { unitId: spellId, level: 3, spellFactoryLevel: 7, laboratoryLevel: 13 },
            { unitId: spellId, level: 4, spellFactoryLevel: 7, laboratoryLevel: 14 },
            { unitId: spellId, level: 4, spellFactoryLevel: 7, laboratoryLevel: 15 },
        ]);

		// Insert data for new "Balloon" level
		const balloon = await db.getRow<Unit>('units', { name: 'Balloon' });
		const superBalloon = await db.getRow<Unit>('units', { name: 'Rocket Balloon' });
		await db.insertOne('unit_levels', { unitId: balloon.id, level: 12, barrackLevel: 6, laboratoryLevel: 15 });
		await db.insertOne('unit_levels', { unitId: superBalloon.id, level: 12, barrackLevel: 6, laboratoryLevel: 1 });

		// Insert data for new "Druid" level
		const druid = await db.getRow<Unit>('units', { name: 'Druid' });
		await db.insertOne('unit_levels', { unitId: druid.id, level: 5, barrackLevel: 11, laboratoryLevel: 15 });

		// Insert data for new "Battle Blimp" level
		const blimp = await db.getRow<Unit>('units', { name: 'Battle Blimp' });
		await db.insertOne('unit_levels', { unitId: blimp.id, level: 5, barrackLevel: 2, laboratoryLevel: 13 });

		// Insert data for new "Frosty" levels
		const frosty = await db.getRow<Pet>('pets', { name: 'Frosty' });
		await db.insertMany('pet_levels', [
            { petId: frosty.id, level: 11, petHouseLevel: 11 },
            { petId: frosty.id, level: 12, petHouseLevel: 11 },
            { petId: frosty.id, level: 13, petHouseLevel: 11 },
            { petId: frosty.id, level: 14, petHouseLevel: 11 },
            { petId: frosty.id, level: 15, petHouseLevel: 11 },
        ]);
	});
	// Insert vote metric so we can store it's weight and update it on-demand if required
	// NOTE: minAgeHours doesn't have any effect since votes are recorded externally of army_metric_events
	runStep(52, `
		INSERT INTO metrics (name, weight, minAgeHours) VALUES
			('vote', 50, 1)
	`);
	runStep(53, async (db: MySQL) => {
		// Insert data for new "Heroic Torch" equipment
		const equipmentId = await db.insertOne('equipment', {
			hero: 'Grand Warden',
			name: 'Heroic Torch',
			epic: 1,
            clashId: 19,
		});
		// Insert levels
		await db.insertMany('equipment_levels', [
			{ equipmentId, level: 1, blacksmithLevel: 1 },
			{ equipmentId, level: 2, blacksmithLevel: 1 },
			{ equipmentId, level: 3, blacksmithLevel: 1 },
			{ equipmentId, level: 4, blacksmithLevel: 1 },
			{ equipmentId, level: 5, blacksmithLevel: 1 },
			{ equipmentId, level: 6, blacksmithLevel: 1 },
			{ equipmentId, level: 7, blacksmithLevel: 1 },
			{ equipmentId, level: 8, blacksmithLevel: 1 },
			{ equipmentId, level: 9, blacksmithLevel: 1 },
			{ equipmentId, level: 10, blacksmithLevel: 1 },
			{ equipmentId, level: 11, blacksmithLevel: 1 },
			{ equipmentId, level: 12, blacksmithLevel: 1 },
			{ equipmentId, level: 13, blacksmithLevel: 3 },
			{ equipmentId, level: 14, blacksmithLevel: 3 },
			{ equipmentId, level: 15, blacksmithLevel: 3 },
			{ equipmentId, level: 16, blacksmithLevel: 5 },
			{ equipmentId, level: 17, blacksmithLevel: 5 },
			{ equipmentId, level: 18, blacksmithLevel: 5 },
			{ equipmentId, level: 19, blacksmithLevel: 7 },
			{ equipmentId, level: 20, blacksmithLevel: 7 },
			{ equipmentId, level: 21, blacksmithLevel: 7 },
			{ equipmentId, level: 22, blacksmithLevel: 8 },
			{ equipmentId, level: 23, blacksmithLevel: 8 },
			{ equipmentId, level: 24, blacksmithLevel: 8 },
			{ equipmentId, level: 25, blacksmithLevel: 9 },
			{ equipmentId, level: 26, blacksmithLevel: 9 },
			{ equipmentId, level: 27, blacksmithLevel: 9 },
		]);

		// Insert data for new "Lava Hound" level
		const lavaHound = await db.getRow<Unit>('units', { name: 'Lava Hound' });
		const iceHound = await db.getRow<Unit>('units', { name: 'Ice Hound' });
		await db.insertOne('unit_levels', { unitId: lavaHound.id, level: 7, barrackLevel: 6, laboratoryLevel: 14 });
		await db.insertOne('unit_levels', { unitId: iceHound.id, level: 7, barrackLevel: 6, laboratoryLevel: 1 });

		// Insert data for new "Ice Block" level
		const iceBlock = await db.getRow<Unit>('units', { name: 'Ice Block' });
        await db.insertOne('unit_levels', { unitId: iceBlock.id, level: 5, spellFactoryLevel: 7, laboratoryLevel: 15 });
	});
	runStep(54, async (db: MySQL) => {
		// Insert data for new "Meteor Staff" equipment
		const equipmentId = await db.insertOne('equipment', {
			hero: 'Minion Prince',
			name: 'Meteor Staff',
			epic: 1,
            clashId: 49,
		});
		// Insert levels
		await db.insertMany('equipment_levels', [
			{ equipmentId, level: 1, blacksmithLevel: 1 },
			{ equipmentId, level: 2, blacksmithLevel: 1 },
			{ equipmentId, level: 3, blacksmithLevel: 1 },
			{ equipmentId, level: 4, blacksmithLevel: 1 },
			{ equipmentId, level: 5, blacksmithLevel: 1 },
			{ equipmentId, level: 6, blacksmithLevel: 1 },
			{ equipmentId, level: 7, blacksmithLevel: 1 },
			{ equipmentId, level: 8, blacksmithLevel: 1 },
			{ equipmentId, level: 9, blacksmithLevel: 1 },
			{ equipmentId, level: 10, blacksmithLevel: 1 },
			{ equipmentId, level: 11, blacksmithLevel: 1 },
			{ equipmentId, level: 12, blacksmithLevel: 1 },
			{ equipmentId, level: 13, blacksmithLevel: 3 },
			{ equipmentId, level: 14, blacksmithLevel: 3 },
			{ equipmentId, level: 15, blacksmithLevel: 3 },
			{ equipmentId, level: 16, blacksmithLevel: 5 },
			{ equipmentId, level: 17, blacksmithLevel: 5 },
			{ equipmentId, level: 18, blacksmithLevel: 5 },
			{ equipmentId, level: 19, blacksmithLevel: 7 },
			{ equipmentId, level: 20, blacksmithLevel: 7 },
			{ equipmentId, level: 21, blacksmithLevel: 7 },
			{ equipmentId, level: 22, blacksmithLevel: 8 },
			{ equipmentId, level: 23, blacksmithLevel: 8 },
			{ equipmentId, level: 24, blacksmithLevel: 8 },
			{ equipmentId, level: 25, blacksmithLevel: 9 },
			{ equipmentId, level: 26, blacksmithLevel: 9 },
			{ equipmentId, level: 27, blacksmithLevel: 9 },
		]);
	});
	runStep(55, async (db) => {
		await db.insertOne('town_halls', {
			level: 18,
			maxBarracks: 19,
			maxDarkBarracks: 12,
			maxLaboratory: 16,
			maxSpellFactory: 9,
			maxDarkSpellFactory: 7,
			maxWorkshop: 8,
			troopCapacity: 340,
			spellCapacity: 11,
			siegeCapacity: 1,
			maxCc: 14,
			maxBlacksmith: 9,
			maxPetHouse: 11,
			maxBarbarianKing: 105,
			maxArcherQueen: 105,
			maxGrandWarden: 80,
			maxRoyalChampion: 55,
			maxMinionPrince: 95,
			ccLaboratoryCap: 16,
			ccTroopCapacity: 55,
			ccSpellCapacity: 4,
			ccSiegeCapacity: 2,
		});

		// Insert data for new "Meteor Golem" troop
        const meteorGolemId = await db.insertOne('units', {
            type: 'Troop',
            name: 'Meteor Golem',
            clashId: '177',
            housingSpace: 40,
            productionBuilding: 'Barrack',
            isSuper: false,
            isFlying: false,
            isJumper: true,
            airTargets: true,
            groundTargets: true,
        });
        await db.insertMany('unit_levels', [
            { unitId: meteorGolemId, level: 1, barrackLevel: 19, laboratoryLevel: 1 },
            { unitId: meteorGolemId, level: 2, barrackLevel: 19, laboratoryLevel: 15 },
            { unitId: meteorGolemId, level: 3, barrackLevel: 19, laboratoryLevel: 16 },
        ]);

		// Insert data for new "Totem" spell
        const totemId = await db.insertOne('units', {
            type: 'Spell',
            name: 'Totem',
            clashId: '120',
            housingSpace: 1,
            productionBuilding: 'Spell Factory',
        });
        await db.insertMany('unit_levels', [
            { unitId: totemId, level: 1, spellFactoryLevel: 9, laboratoryLevel: 1 },
            { unitId: totemId, level: 2, spellFactoryLevel: 9, laboratoryLevel: 14 },
            { unitId: totemId, level: 3, spellFactoryLevel: 9, laboratoryLevel: 15 },
            { unitId: totemId, level: 4, spellFactoryLevel: 9, laboratoryLevel: 16 },
        ]);

		// Insert data for new "Poison Lizard" levels
		const lizard = await db.getRow<Pet>('pets', { name: 'Poison Lizard' });
		await db.insertMany('pet_levels', [
            { petId: lizard.id, level: 11, petHouseLevel: 11 },
            { petId: lizard.id, level: 12, petHouseLevel: 11 },
            { petId: lizard.id, level: 13, petHouseLevel: 11 },
            { petId: lizard.id, level: 14, petHouseLevel: 11 },
            { petId: lizard.id, level: 15, petHouseLevel: 11 },
        ]);

		// Insert data for new "Giant" level
		const giant = await db.getRow<Unit>('units', { name: 'Giant' });
		const superGiant = await db.getRow<Unit>('units', { name: 'Super Giant' });
		await db.insertOne('unit_levels', { unitId: giant.id, level: 14, barrackLevel: 3, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superGiant.id, level: 14, barrackLevel: 3, laboratoryLevel: 1 });

		// Insert data for new "Wall Breaker" level
		const wallBreaker = await db.getRow<Unit>('units', { name: 'Wall Breaker' });
		const superWallBreaker = await db.getRow<Unit>('units', { name: 'Super Wall Breaker' });
		await db.insertOne('unit_levels', { unitId: wallBreaker.id, level: 14, barrackLevel: 5, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superWallBreaker.id, level: 14, barrackLevel: 5, laboratoryLevel: 1 });

		// Insert data for new "Wizard" level
		const wizard = await db.getRow<Unit>('units', { name: 'Wizard' });
		const superWizard = await db.getRow<Unit>('units', { name: 'Super Wizard' });
		await db.insertOne('unit_levels', { unitId: wizard.id, level: 14, barrackLevel: 7, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superWizard.id, level: 14, barrackLevel: 7, laboratoryLevel: 1 });

		// Insert data for new "Healer" level
		const healer = await db.getRow<Unit>('units', { name: 'Healer' });
		await db.insertOne('unit_levels', { unitId: healer.id, level: 11, barrackLevel: 8, laboratoryLevel: 16 });

		// Insert data for new "Pekka" level
		const pekka = await db.getRow<Unit>('units', { name: 'P.E.K.K.A' });
		await db.insertOne('unit_levels', { unitId: pekka.id, level: 13, barrackLevel: 10, laboratoryLevel: 16 });

		// Insert data for new "Miner" level
		const miner = await db.getRow<Unit>('units', { name: 'Miner' });
		const superMiner = await db.getRow<Unit>('units', { name: 'Super Miner' });
		await db.insertOne('unit_levels', { unitId: miner.id, level: 12, barrackLevel: 12, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superMiner.id, level: 12, barrackLevel: 12, laboratoryLevel: 1 });

		// Insert data for new "Electro Dragon" level
		const electroDragon = await db.getRow<Unit>('units', { name: 'Electro Dragon' });
		await db.insertOne('unit_levels', { unitId: electroDragon.id, level: 9, barrackLevel: 13, laboratoryLevel: 16 });

		// Insert data for new "Dragon Rider" level
		const dragonRider = await db.getRow<Unit>('units', { name: 'Dragon Rider' });
		await db.insertOne('unit_levels', { unitId: dragonRider.id, level: 6, barrackLevel: 15, laboratoryLevel: 16 });

		// Insert data for new "Thrower" level
		const thrower = await db.getRow<Unit>('units', { name: 'Thrower' });
		await db.insertOne('unit_levels', { unitId: thrower.id, level: 4, barrackLevel: 18, laboratoryLevel: 16 });

		// Insert data for new "Minion" level
		const minion = await db.getRow<Unit>('units', { name: 'Minion' });
		const superMinion = await db.getRow<Unit>('units', { name: 'Super Minion' });
		await db.insertOne('unit_levels', { unitId: minion.id, level: 14, barrackLevel: 1, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superMinion.id, level: 14, barrackLevel: 1, laboratoryLevel: 1 });

		// Insert data for new "Bowler" level
		const bowler = await db.getRow<Unit>('units', { name: 'Bowler' });
		const superBowler = await db.getRow<Unit>('units', { name: 'Super Bowler' });
		await db.insertOne('unit_levels', { unitId: bowler.id, level: 10, barrackLevel: 7, laboratoryLevel: 16 });
		await db.insertOne('unit_levels', { unitId: superBowler.id, level: 10, barrackLevel: 7, laboratoryLevel: 1 });

		// Insert data for new "Lightning" level
		const lightning = await db.getRow<Unit>('units', { name: 'Lightning' });
        await db.insertOne('unit_levels', { unitId: lightning.id, level: 13, spellFactoryLevel: 1, laboratoryLevel: 16 });

		// Insert data for new "Heal" level
		const heal = await db.getRow<Unit>('units', { name: 'Healing' });
        await db.insertOne('unit_levels', { unitId: heal.id, level: 12, spellFactoryLevel: 2, laboratoryLevel: 16 });

		// Insert data for new "Poison" level
		const poison = await db.getRow<Unit>('units', { name: 'Poison' });
        await db.insertOne('unit_levels', { unitId: poison.id, level: 12, spellFactoryLevel: 1, laboratoryLevel: 16 });

		// Insert data for new "Haste" level
		const haste = await db.getRow<Unit>('units', { name: 'Haste' });
        await db.insertOne('unit_levels', { unitId: haste.id, level: 7, spellFactoryLevel: 3, laboratoryLevel: 16 });

		// Insert data for new "Bat" level
		const bat = await db.getRow<Unit>('units', { name: 'Bat' });
        await db.insertOne('unit_levels', { unitId: bat.id, level: 8, spellFactoryLevel: 5, laboratoryLevel: 16 });

		// Insert data for new "Wall Wrecker" level
		const wallWrecker = await db.getRow<Unit>('units', { name: 'Wall Wrecker' });
        await db.insertOne('unit_levels', { unitId: wallWrecker.id, level: 6, barrackLevel: 1, laboratoryLevel: 16 });
	});
	runStep(56, async (db) => {
		// Insert data for new "Frost Flake" equipment
		const equipmentId = await db.insertOne('equipment', {
			hero: 'Royal Champion',
			name: 'Frost Flake',
			epic: 1,
            clashId: 50,
		});
		// Insert levels
		await db.insertMany('equipment_levels', [
			{ equipmentId, level: 1, blacksmithLevel: 1 },
			{ equipmentId, level: 2, blacksmithLevel: 1 },
			{ equipmentId, level: 3, blacksmithLevel: 1 },
			{ equipmentId, level: 4, blacksmithLevel: 1 },
			{ equipmentId, level: 5, blacksmithLevel: 1 },
			{ equipmentId, level: 6, blacksmithLevel: 1 },
			{ equipmentId, level: 7, blacksmithLevel: 1 },
			{ equipmentId, level: 8, blacksmithLevel: 1 },
			{ equipmentId, level: 9, blacksmithLevel: 1 },
			{ equipmentId, level: 10, blacksmithLevel: 1 },
			{ equipmentId, level: 11, blacksmithLevel: 1 },
			{ equipmentId, level: 12, blacksmithLevel: 1 },
			{ equipmentId, level: 13, blacksmithLevel: 3 },
			{ equipmentId, level: 14, blacksmithLevel: 3 },
			{ equipmentId, level: 15, blacksmithLevel: 3 },
			{ equipmentId, level: 16, blacksmithLevel: 5 },
			{ equipmentId, level: 17, blacksmithLevel: 5 },
			{ equipmentId, level: 18, blacksmithLevel: 5 },
			{ equipmentId, level: 19, blacksmithLevel: 7 },
			{ equipmentId, level: 20, blacksmithLevel: 7 },
			{ equipmentId, level: 21, blacksmithLevel: 7 },
			{ equipmentId, level: 22, blacksmithLevel: 8 },
			{ equipmentId, level: 23, blacksmithLevel: 8 },
			{ equipmentId, level: 24, blacksmithLevel: 8 },
			{ equipmentId, level: 25, blacksmithLevel: 9 },
			{ equipmentId, level: 26, blacksmithLevel: 9 },
			{ equipmentId, level: 27, blacksmithLevel: 9 },
		]);
	});
}
