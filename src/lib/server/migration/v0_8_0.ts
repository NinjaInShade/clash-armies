import type { MySQL, MigrationFn } from '@ninjalib/sql';
import type { Unit } from '$types';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    // New army camp level
    // 85->88 space, 4 army camps = 352
    runStep(61, `
        UPDATE town_halls SET
            troopCapacity = 352
        WHERE level = 18
    `);
    // New siege workshop and blacksmith levels
    runStep(62, `
        UPDATE town_halls SET
            maxWorkshop = 9,
            maxBlacksmith = 10
        WHERE level = 17 OR level = 18
    `);
    runStep(63, async (db: MySQL) => {
        // "The sound of clash" update

        // Insert data for new "Sky Wagon" siege machine
        const siegeId = await db.insertOne('units', {
            type: 'Siege',
            name: 'Sky Wagon',
            clashId: '188',
            housingSpace: 1,
            productionBuilding: 'Siege Workshop',
            isFlying: true,
            airTargets: true,
            groundTargets: true,
        });
        await db.insertMany('unit_levels', [
            { unitId: siegeId, level: 1, barrackLevel: 9, laboratoryLevel: 1 },
            { unitId: siegeId, level: 2, barrackLevel: 9, laboratoryLevel: 15 },
            { unitId: siegeId, level: 3, barrackLevel: 9, laboratoryLevel: 16 },
            { unitId: siegeId, level: 4, barrackLevel: 9, laboratoryLevel: 16 },
        ]);

        // Insert data for new "Electro Fangs" equipment
        const efId = await db.insertOne('equipment', { hero: 'Dragon Duke', name: 'Electro Fangs', epic: false, clashId: 59 });
        await db.insertMany('equipment_levels', [
            { equipmentId: efId, level: 1, blacksmithLevel: 10 },
            { equipmentId: efId, level: 2, blacksmithLevel: 10 },
            { equipmentId: efId, level: 3, blacksmithLevel: 10 },
            { equipmentId: efId, level: 4, blacksmithLevel: 10 },
            { equipmentId: efId, level: 5, blacksmithLevel: 10 },
            { equipmentId: efId, level: 6, blacksmithLevel: 10 },
            { equipmentId: efId, level: 7, blacksmithLevel: 10 },
            { equipmentId: efId, level: 8, blacksmithLevel: 10 },
            { equipmentId: efId, level: 9, blacksmithLevel: 10 },
            { equipmentId: efId, level: 10, blacksmithLevel: 10 },
            { equipmentId: efId, level: 11, blacksmithLevel: 10 },
            { equipmentId: efId, level: 12, blacksmithLevel: 10 },
            { equipmentId: efId, level: 13, blacksmithLevel: 10 },
            { equipmentId: efId, level: 14, blacksmithLevel: 10 },
            { equipmentId: efId, level: 15, blacksmithLevel: 10 },
            { equipmentId: efId, level: 16, blacksmithLevel: 10 },
            { equipmentId: efId, level: 17, blacksmithLevel: 10 },
            { equipmentId: efId, level: 18, blacksmithLevel: 10 },
        ]);

        // Insert data for new "Rage" level
		const rage = await db.getRow<Unit>('units', { name: 'Rage' });
        await db.insertOne('unit_levels', { unitId: rage.id, level: 7, spellFactoryLevel: 3, laboratoryLevel: 16 });

        // Insert data for new "Freeze" level
		const freeze = await db.getRow<Unit>('units', { name: 'Freeze' });
        await db.insertOne('unit_levels', { unitId: freeze.id, level: 8, spellFactoryLevel: 4, laboratoryLevel: 16 });

        // Insert data for new "Clone" level
		const clone = await db.getRow<Unit>('units', { name: 'Clone' });
        await db.insertOne('unit_levels', { unitId: clone.id, level: 9, spellFactoryLevel: 5, laboratoryLevel: 16 });

        // Insert data for new "Recall" level
		const recall = await db.getRow<Unit>('units', { name: 'Recall' });
        await db.insertOne('unit_levels', { unitId: recall.id, level: 7, spellFactoryLevel: 7, laboratoryLevel: 16 });

        // Insert data for new "Overgrowth" level
		const overgrowth = await db.getRow<Unit>('units', { name: 'Overgrowth' });
        await db.insertOne('unit_levels', { unitId: overgrowth.id, level: 5, spellFactoryLevel: 6, laboratoryLevel: 16 });

        // Insert data for new "Ice Block" level
		const iceBlock = await db.getRow<Unit>('units', { name: 'Ice Block' });
        await db.insertOne('unit_levels', { unitId: iceBlock.id, level: 6, spellFactoryLevel: 7, laboratoryLevel: 16 });

        // Insert data for new "Battle Drill" level
		const battleDrill = await db.getRow<Unit>('units', { name: 'Battle Drill' });
        await db.insertOne('unit_levels', { unitId: battleDrill.id, level: 6, barrackLevel: 7, laboratoryLevel: 16 });

        // Insert data for new "Siege Barracks" level
		const siegeBarracks = await db.getRow<Unit>('units', { name: 'Siege Barracks' });
		await db.insertOne('unit_levels', { unitId: siegeBarracks.id, level: 6, barrackLevel: 4, laboratoryLevel: 16 });

        // Insert data for new "Log Launcher" level
        const logLauncher = await db.getRow<Unit>('units', { name: 'Log Launcher' });
        await db.insertOne('unit_levels', { unitId: logLauncher.id, level: 6, barrackLevel: 5, laboratoryLevel: 16 });

        // Insert data for new "Battle Blimp" level
		const battleBlimp = await db.getRow<Unit>('units', { name: 'Battle Blimp' });
        await db.insertOne('unit_levels', { unitId: battleBlimp.id, level: 6, barrackLevel: 2, laboratoryLevel: 16 });

        // Insert data for new "Barbarian" level
		const barbarian = await db.getRow<Unit>('units', { name: 'Barbarian' });
		const superBarbarian = await db.getRow<Unit>('units', { name: 'Super Barbarian' });
		await db.insertOne('unit_levels', { unitId: barbarian.id, level: 13, barrackLevel: 1, laboratoryLevel: 16 });
        await db.insertOne('unit_levels', { unitId: superBarbarian.id, level: 13, barrackLevel: 1, laboratoryLevel: 1 });

        // Insert data for new "Goblin" level
		const goblin = await db.getRow<Unit>('units', { name: 'Goblin' });
		const sneakyGoblin = await db.getRow<Unit>('units', { name: 'Sneaky Goblin' });
		await db.insertOne('unit_levels', { unitId: goblin.id, level: 10, barrackLevel: 4, laboratoryLevel: 16 });
        await db.insertOne('unit_levels', { unitId: sneakyGoblin.id, level: 10, barrackLevel: 4, laboratoryLevel: 1 });

        // Insert data for new "Valkyrie" level
        const valkyrie = await db.getRow<Unit>('units', { name: 'Valkyrie' });
        const superValkyrie = await db.getRow<Unit>('units', { name: 'Super Valkyrie' });
        await db.insertOne('unit_levels', { unitId: valkyrie.id, level: 12, barrackLevel: 3, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superValkyrie.id, level: 12, barrackLevel: 3, laboratoryLevel: 1 });

        // Insert data for new "Golem" level
        const golem = await db.getRow<Unit>('units', { name: 'Golem' });
        await db.insertOne('unit_levels', { unitId: golem.id, level: 15, barrackLevel: 4, laboratoryLevel: 16 });

        // Insert data for new "Dragon" level
        const dragon = await db.getRow<Unit>('units', { name: 'Dragon' });
        const superDragon = await db.getRow<Unit>('units', { name: 'Super Dragon' });
        await db.insertOne('unit_levels', { unitId: dragon.id, level: 13, barrackLevel: 9, laboratoryLevel: 16 });
        await db.insertOne('unit_levels', { unitId: superDragon.id, level: 13, barrackLevel: 9, laboratoryLevel: 1 });

        // Insert data for new "Balloon" level
        const balloon = await db.getRow<Unit>('units', { name: 'Balloon' });
        const rocketBalloon = await db.getRow<Unit>('units', { name: 'Rocket Balloon' });
        await db.insertOne('unit_levels', { unitId: balloon.id, level: 13, barrackLevel: 6, laboratoryLevel: 16 });
        await db.insertOne('unit_levels', { unitId: rocketBalloon.id, level: 13, barrackLevel: 6, laboratoryLevel: 1 });

        // Insert data for new "Yeti" level
        const yeti = await db.getRow<Unit>('units', { name: 'Yeti' });
        const superYeti = await db.getRow<Unit>('units', { name: 'Super Yeti' });
        await db.insertOne('unit_levels', { unitId: yeti.id, level: 8, barrackLevel: 14, laboratoryLevel: 16 });
        await db.insertOne('unit_levels', { unitId: superYeti.id, level: 8, barrackLevel: 14, laboratoryLevel: 1 });

        // Insert data for new "Headhunter" level
        const headhunter = await db.getRow<Unit>('units', { name: 'Headhunter' });
        await db.insertOne('unit_levels', { unitId: headhunter.id, level: 4, barrackLevel: 9, laboratoryLevel: 16 });

        // Insert data for new "Root Rider" level
        const rootRider = await db.getRow<Unit>('units', { name: 'Root Rider' });
        await db.insertOne('unit_levels', { unitId: rootRider.id, level: 4, barrackLevel: 17, laboratoryLevel: 16 });

        // Insert data for new "Druid" level
        const druid = await db.getRow<Unit>('units', { name: 'Druid' });
        await db.insertOne('unit_levels', { unitId: druid.id, level: 6, barrackLevel: 11, laboratoryLevel: 16 });
	});
}
