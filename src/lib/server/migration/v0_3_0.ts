import type { MySQL, MigrationFn } from '@ninjalib/sql';
import type { Unit } from '$types';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(29, `
        INSERT INTO town_halls VALUES
            (17, 18, 12, 15, 8, 6, 8, 340, 11, 1, 13, 9, 11, 100, 100, 75, 50, 15, 55, 3, 2)
    `);
    runStep(30, `
        UPDATE town_halls SET
            ccLaboratoryCap = 15,
            maxDarkBarracks = 12
        WHERE level = 15 OR level = 16
    `);
    runStep(31, async (db: MySQL) => {
        // Insert data for new "Thrower" troop
        const unitId = await db.insertOne('units', {
            type: 'Troop',
            name: 'Thrower',
            objectId: '4000132',
            housingSpace: 16,
            trainingTime: 95,
            productionBuilding: 'Barrack',
            isSuper: false,
            isFlying: false,
            isJumper: false,
            airTargets: true,
            groundTargets: true,
        });
        await db.insertMany('unit_levels', [
            { unitId, level: 1, barrackLevel: 18, laboratoryLevel: 1 },
            { unitId, level: 2, barrackLevel: 18, laboratoryLevel: 14 },
            { unitId, level: 3, barrackLevel: 18, laboratoryLevel: 15 },
        ]);

        // Insert data for new "Furnace" troop
        const furnaceId = await db.insertOne('units', {
            type: 'Troop',
            name: 'Furnace',
            objectId: '4000150',
            housingSpace: 18,
            trainingTime: 60, // This will be going very soon
            productionBuilding: 'Dark Elixir Barrack',
            isSuper: false,
            isFlying: false,
            isJumper: false,
            airTargets: false,
            groundTargets: true,
        });
        await db.insertMany('unit_levels', [
            { unitId: furnaceId, level: 1, barrackLevel: 12, laboratoryLevel: 13 },
            { unitId: furnaceId, level: 2, barrackLevel: 12, laboratoryLevel: 13 },
            { unitId: furnaceId, level: 3, barrackLevel: 12, laboratoryLevel: 14 },
            { unitId: furnaceId, level: 4, barrackLevel: 12, laboratoryLevel: 15 },
        ]);

        // Insert data for new "Revive" spell
        const spellId = await db.insertOne('units', {
            type: 'Spell',
            name: 'Revive',
            objectId: '26000098',
            housingSpace: 2,
            trainingTime: 180,
            productionBuilding: 'Spell Factory',
        });
        await db.insertMany('unit_levels', [
            { unitId: spellId, level: 1, spellFactoryLevel: 8, laboratoryLevel: 1 },
            { unitId: spellId, level: 2, spellFactoryLevel: 8, laboratoryLevel: 13 },
            { unitId: spellId, level: 3, spellFactoryLevel: 8, laboratoryLevel: 14 },
            { unitId: spellId, level: 4, spellFactoryLevel: 8, laboratoryLevel: 15 },
        ]);

        // Insert data for new "Troop Launcher" siege machine
        const siegeId = await db.insertOne('units', {
            type: 'Siege',
            name: 'Troop Launcher',
            objectId: '4000135',
            housingSpace: 1,
            trainingTime: 1200,
            productionBuilding: 'Siege Workshop',
            isSuper: false,
            isFlying: false,
            isJumper: false,
            airTargets: false,
            groundTargets: false,
        });
        await db.insertMany('unit_levels', [
            { unitId: siegeId, level: 1, barrackLevel: 8, laboratoryLevel: 13 },
            { unitId: siegeId, level: 2, barrackLevel: 8, laboratoryLevel: 14 },
            { unitId: siegeId, level: 3, barrackLevel: 8, laboratoryLevel: 14 },
            { unitId: siegeId, level: 4, barrackLevel: 8, laboratoryLevel: 15 },
        ]);

        // Update existing troops with their new levels
        const archer = await db.getRow<Unit>('units', { name: 'Archer' });
        const superArcher = await db.getRow<Unit>('units', { name: 'Super Archer' });
        await db.insertOne('unit_levels', { unitId: archer.id, level: 13, barrackLevel: 2, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superArcher.id, level: 13, barrackLevel: 2, laboratoryLevel: 1 });

        const giant = await db.getRow<Unit>('units', { name: 'Giant' });
        const superGiant = await db.getRow<Unit>('units', { name: 'Super Giant' });
        await db.insertOne('unit_levels', { unitId: giant.id, level: 13, barrackLevel: 3, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superGiant.id, level: 13, barrackLevel: 3, laboratoryLevel: 1 });

        const wallBreaker = await db.getRow<Unit>('units', { name: 'Wall Breaker' });
        const superWallBreaker = await db.getRow<Unit>('units', { name: 'Super Wall Breaker' });
        await db.insertOne('unit_levels', { unitId: wallBreaker.id, level: 13, barrackLevel: 5, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superWallBreaker.id, level: 13, barrackLevel: 5, laboratoryLevel: 1 });

        const wizard = await db.getRow<Unit>('units', { name: 'Wizard' });
        const superWizard = await db.getRow<Unit>('units', { name: 'Super Wizard' });
        await db.insertOne('unit_levels', { unitId: wizard.id, level: 13, barrackLevel: 7, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superWizard.id, level: 13, barrackLevel: 7, laboratoryLevel: 1 });

        const dragon = await db.getRow<Unit>('units', { name: 'Dragon' });
        const superDragon = await db.getRow<Unit>('units', { name: 'Super Dragon' });
        await db.insertOne('unit_levels', { unitId: dragon.id, level: 12, barrackLevel: 9, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superDragon.id, level: 12, barrackLevel: 9, laboratoryLevel: 1 });

        const miner = await db.getRow<Unit>('units', { name: 'Miner' });
        const superMiner = await db.getRow<Unit>('units', { name: 'Super Miner' });
        await db.insertOne('unit_levels', { unitId: miner.id, level: 11, barrackLevel: 12, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superMiner.id, level: 11, barrackLevel: 12, laboratoryLevel: 1 });

        const bowler = await db.getRow<Unit>('units', { name: 'Bowler' });
        const superBowler = await db.getRow<Unit>('units', { name: 'Super Bowler' });
        await db.insertOne('unit_levels', { unitId: bowler.id, level: 9, barrackLevel: 7, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superBowler.id, level: 9, barrackLevel: 7, laboratoryLevel: 1 });

        const healer = await db.getRow<Unit>('units', { name: 'Healer' });
        await db.insertOne('unit_levels', { unitId: healer.id, level: 10, barrackLevel: 8, laboratoryLevel: 15 });

        const pekka = await db.getRow<Unit>('units', { name: 'P.E.K.K.A' });
        await db.insertOne('unit_levels', { unitId: pekka.id, level: 12, barrackLevel: 10, laboratoryLevel: 15 });

        const iceGolem = await db.getRow<Unit>('units', { name: 'Ice Golem' });
        await db.insertOne('unit_levels', { unitId: iceGolem.id, level: 9, barrackLevel: 8, laboratoryLevel: 15 });

        const golem = await db.getRow<Unit>('units', { name: 'Golem' });
        await db.insertOne('unit_levels', { unitId: golem.id, level: 14, barrackLevel: 4, laboratoryLevel: 15 });

        const yeti = await db.getRow<Unit>('units', { name: 'Yeti' });
        await db.insertOne('unit_levels', { unitId: yeti.id, level: 7, barrackLevel: 14, laboratoryLevel: 15 });

        const electroDragon = await db.getRow<Unit>('units', { name: 'Electro Dragon' });
        await db.insertOne('unit_levels', { unitId: electroDragon.id, level: 8, barrackLevel: 13, laboratoryLevel: 15 });

        const dragonRider = await db.getRow<Unit>('units', { name: 'Dragon Rider' });
        await db.insertOne('unit_levels', { unitId: dragonRider.id, level: 5, barrackLevel: 15, laboratoryLevel: 15 });

        const minion = await db.getRow<Unit>('units', { name: 'Minion' });
        const superMinion = await db.getRow<Unit>('units', { name: 'Super Minion' });
        await db.insertOne('unit_levels', { unitId: minion.id, level: 13, barrackLevel: 1, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superMinion.id, level: 13, barrackLevel: 1, laboratoryLevel: 1 });

        const babyDragon = await db.getRow<Unit>('units', { name: 'Baby Dragon' });
        const infernoDragon = await db.getRow<Unit>('units', { name: 'Inferno Dragon' });
        await db.insertOne('unit_levels', { unitId: babyDragon.id, level: 11, barrackLevel: 11, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: infernoDragon.id, level: 11, barrackLevel: 11, laboratoryLevel: 1 });

        const hog = await db.getRow<Unit>('units', { name: 'Hog Rider' });
        const superHog = await db.getRow<Unit>('units', { name: 'Super Hog Rider' });
        await db.insertOne('unit_levels', { unitId: hog.id, level: 14, barrackLevel: 2, laboratoryLevel: 15 });
        await db.insertOne('unit_levels', { unitId: superHog.id, level: 14, barrackLevel: 2, laboratoryLevel: 1 });

        const battleDrill = await db.getRow<Unit>('units', { name: 'Battle Drill' });
        await db.insertOne('unit_levels', { unitId: battleDrill.id, level: 5, barrackLevel: 7, laboratoryLevel: 15 });

        const lightning = await db.getRow<Unit>('units', { name: 'Lightning' });
        await db.insertOne('unit_levels', { unitId: lightning.id, level: 12, spellFactoryLevel: 1, laboratoryLevel: 15 });

        const healing = await db.getRow<Unit>('units', { name: 'Healing' });
        await db.insertOne('unit_levels', { unitId: healing.id, level: 11, spellFactoryLevel: 2, laboratoryLevel: 15 });

        const recall = await db.getRow<Unit>('units', { name: 'Recall' });
        await db.insertOne('unit_levels', { unitId: recall.id, level: 6, spellFactoryLevel: 7, laboratoryLevel: 15 });

        const haste = await db.getRow<Unit>('units', { name: 'Haste' });
        await db.insertOne('unit_levels', { unitId: haste.id, level: 6, spellFactoryLevel: 3, laboratoryLevel: 15 });

        const poison = await db.getRow<Unit>('units', { name: 'Poison' });
        await db.insertOne('unit_levels', { unitId: poison.id, level: 11, spellFactoryLevel: 1, laboratoryLevel: 15 });

        const bat = await db.getRow<Unit>('units', { name: 'Bat' });
        await db.insertOne('unit_levels', { unitId: bat.id, level: 7, spellFactoryLevel: 5, laboratoryLevel: 15 });

        // LavaLoon puppet (GW)
        const llId = await db.insertOne('equipment', { hero: 'Grand Warden', name: 'Lavaloon Puppet', epic: true });
        await db.insertMany('equipment_levels', [
            { equipmentId: llId, level: 1, blacksmithLevel: 1 },
            { equipmentId: llId, level: 2, blacksmithLevel: 1 },
            { equipmentId: llId, level: 3, blacksmithLevel: 1 },
            { equipmentId: llId, level: 4, blacksmithLevel: 1 },
            { equipmentId: llId, level: 5, blacksmithLevel: 1 },
            { equipmentId: llId, level: 6, blacksmithLevel: 1 },
            { equipmentId: llId, level: 7, blacksmithLevel: 1 },
            { equipmentId: llId, level: 8, blacksmithLevel: 1 },
            { equipmentId: llId, level: 9, blacksmithLevel: 1 },
            { equipmentId: llId, level: 10, blacksmithLevel: 1 },
            { equipmentId: llId, level: 11, blacksmithLevel: 1 },
            { equipmentId: llId, level: 12, blacksmithLevel: 1 },
            { equipmentId: llId, level: 13, blacksmithLevel: 3 },
            { equipmentId: llId, level: 14, blacksmithLevel: 3 },
            { equipmentId: llId, level: 15, blacksmithLevel: 3 },
            { equipmentId: llId, level: 16, blacksmithLevel: 5 },
            { equipmentId: llId, level: 17, blacksmithLevel: 5 },
            { equipmentId: llId, level: 18, blacksmithLevel: 5 },
            { equipmentId: llId, level: 19, blacksmithLevel: 7 },
            { equipmentId: llId, level: 20, blacksmithLevel: 7 },
            { equipmentId: llId, level: 21, blacksmithLevel: 7 },
            { equipmentId: llId, level: 22, blacksmithLevel: 8 },
            { equipmentId: llId, level: 23, blacksmithLevel: 8 },
            { equipmentId: llId, level: 24, blacksmithLevel: 8 },
            { equipmentId: llId, level: 25, blacksmithLevel: 9 },
            { equipmentId: llId, level: 26, blacksmithLevel: 9 },
            { equipmentId: llId, level: 27, blacksmithLevel: 9 },
        ]);

        // Electro Boots (RC)
        const ebId = await db.insertOne('equipment', { hero: 'Royal Champion', name: 'Electro Boots', epic: true });
        await db.insertMany('equipment_levels', [
            { equipmentId: ebId, level: 1, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 2, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 3, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 4, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 5, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 6, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 7, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 8, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 9, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 10, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 11, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 12, blacksmithLevel: 1 },
            { equipmentId: ebId, level: 13, blacksmithLevel: 3 },
            { equipmentId: ebId, level: 14, blacksmithLevel: 3 },
            { equipmentId: ebId, level: 15, blacksmithLevel: 3 },
            { equipmentId: ebId, level: 16, blacksmithLevel: 5 },
            { equipmentId: ebId, level: 17, blacksmithLevel: 5 },
            { equipmentId: ebId, level: 18, blacksmithLevel: 5 },
            { equipmentId: ebId, level: 19, blacksmithLevel: 7 },
            { equipmentId: ebId, level: 20, blacksmithLevel: 7 },
            { equipmentId: ebId, level: 21, blacksmithLevel: 7 },
            { equipmentId: ebId, level: 22, blacksmithLevel: 8 },
            { equipmentId: ebId, level: 23, blacksmithLevel: 8 },
            { equipmentId: ebId, level: 24, blacksmithLevel: 8 },
            { equipmentId: ebId, level: 25, blacksmithLevel: 9 },
            { equipmentId: ebId, level: 26, blacksmithLevel: 9 },
            { equipmentId: ebId, level: 27, blacksmithLevel: 9 },
        ]);

        // Snake Bracelet (BK)
        const sbId = await db.insertOne('equipment', { hero: 'Barbarian King', name: 'Snake Bracelet', epic: true });
        await db.insertMany('equipment_levels', [
            { equipmentId: sbId, level: 1, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 2, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 3, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 4, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 5, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 6, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 7, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 8, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 9, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 10, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 11, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 12, blacksmithLevel: 1 },
            { equipmentId: sbId, level: 13, blacksmithLevel: 3 },
            { equipmentId: sbId, level: 14, blacksmithLevel: 3 },
            { equipmentId: sbId, level: 15, blacksmithLevel: 3 },
            { equipmentId: sbId, level: 16, blacksmithLevel: 5 },
            { equipmentId: sbId, level: 17, blacksmithLevel: 5 },
            { equipmentId: sbId, level: 18, blacksmithLevel: 5 },
            { equipmentId: sbId, level: 19, blacksmithLevel: 7 },
            { equipmentId: sbId, level: 20, blacksmithLevel: 7 },
            { equipmentId: sbId, level: 21, blacksmithLevel: 7 },
            { equipmentId: sbId, level: 22, blacksmithLevel: 8 },
            { equipmentId: sbId, level: 23, blacksmithLevel: 8 },
            { equipmentId: sbId, level: 24, blacksmithLevel: 8 },
            { equipmentId: sbId, level: 25, blacksmithLevel: 9 },
            { equipmentId: sbId, level: 26, blacksmithLevel: 9 },
            { equipmentId: sbId, level: 27, blacksmithLevel: 9 },
        ]);

        // Insert data for new "Sneezy" pet
        const snoozyId = await db.insertOne('pets', { name: 'Sneezy' });
        await db.insertMany('pet_levels', [
            { petId: snoozyId, level: 1, petHouseLevel: 11 },
            { petId: snoozyId, level: 2, petHouseLevel: 11 },
            { petId: snoozyId, level: 3, petHouseLevel: 11 },
            { petId: snoozyId, level: 4, petHouseLevel: 11 },
            { petId: snoozyId, level: 5, petHouseLevel: 11 },
            { petId: snoozyId, level: 6, petHouseLevel: 11 },
            { petId: snoozyId, level: 7, petHouseLevel: 11 },
            { petId: snoozyId, level: 8, petHouseLevel: 11 },
            { petId: snoozyId, level: 9, petHouseLevel: 11 },
            { petId: snoozyId, level: 10, petHouseLevel: 11 },
        ]);

        // Insert new pet levels for "Unicorn"
        const unicornId = (await db.query('SELECT id FROM pets WHERE name = ?', ['Unicorn']))[0].id;
        await db.insertMany('pet_levels', [
            { petId: unicornId, level: 11, petHouseLevel: 11 },
            { petId: unicornId, level: 12, petHouseLevel: 11 },
            { petId: unicornId, level: 13, petHouseLevel: 11 },
            { petId: unicornId, level: 14, petHouseLevel: 11 },
            { petId: unicornId, level: 15, petHouseLevel: 11 },
        ]);
    });
    runStep(32, async (db: MySQL) => {
        await db.query(`
            ALTER TABLE town_halls
            ADD COLUMN maxMinionPrince SMALLINT DEFAULT NULL AFTER maxRoyalChampion
        `, []);
        const thToMPLvl = [
            { thLvl: 1, mpLvl: null },
            { thLvl: 2, mpLvl: null },
            { thLvl: 3, mpLvl: null },
            { thLvl: 4, mpLvl: null },
            { thLvl: 5, mpLvl: null },
            { thLvl: 6, mpLvl: null },
            { thLvl: 7, mpLvl: null },
            { thLvl: 8, mpLvl: null },
            { thLvl: 9, mpLvl: 10 },
            { thLvl: 10, mpLvl: 20 },
            { thLvl: 11, mpLvl: 30 },
            { thLvl: 12, mpLvl: 40 },
            { thLvl: 13, mpLvl: 50 },
            { thLvl: 14, mpLvl: 60 },
            { thLvl: 15, mpLvl: 70 },
            { thLvl: 16, mpLvl: 80 },
            { thLvl: 17, mpLvl: 90 },
        ];
        await Promise.all(thToMPLvl.map((entry) => {
            return db.query(`
                UPDATE town_halls SET
                    maxMinionPrince = ?
                WHERE level = ?
            `, [entry.mpLvl, entry.thLvl]);
        }))
        // Henchmen Puppet
        const hpId = await db.insertOne('equipment', { hero: 'Minion Prince', name: 'Henchmen Puppet', epic: false });
        await db.insertMany('equipment_levels', [
            { equipmentId: hpId, level: 1, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 2, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 3, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 4, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 5, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 6, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 7, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 8, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 9, blacksmithLevel: 1 },
            { equipmentId: hpId, level: 10, blacksmithLevel: 3 },
            { equipmentId: hpId, level: 11, blacksmithLevel: 3 },
            { equipmentId: hpId, level: 12, blacksmithLevel: 3 },
            { equipmentId: hpId, level: 13, blacksmithLevel: 5 },
            { equipmentId: hpId, level: 14, blacksmithLevel: 5 },
            { equipmentId: hpId, level: 15, blacksmithLevel: 5 },
            { equipmentId: hpId, level: 16, blacksmithLevel: 7 },
            { equipmentId: hpId, level: 17, blacksmithLevel: 7 },
            { equipmentId: hpId, level: 18, blacksmithLevel: 7 },
        ]);
        // Dark Orb
        const doId = await db.insertOne('equipment', { hero: 'Minion Prince', name: 'Dark Orb', epic: false });
        await db.insertMany('equipment_levels', [
            { equipmentId: doId, level: 1, blacksmithLevel: 1 },
            { equipmentId: doId, level: 2, blacksmithLevel: 1 },
            { equipmentId: doId, level: 3, blacksmithLevel: 1 },
            { equipmentId: doId, level: 4, blacksmithLevel: 1 },
            { equipmentId: doId, level: 5, blacksmithLevel: 1 },
            { equipmentId: doId, level: 6, blacksmithLevel: 1 },
            { equipmentId: doId, level: 7, blacksmithLevel: 1 },
            { equipmentId: doId, level: 8, blacksmithLevel: 1 },
            { equipmentId: doId, level: 9, blacksmithLevel: 1 },
            { equipmentId: doId, level: 10, blacksmithLevel: 3 },
            { equipmentId: doId, level: 11, blacksmithLevel: 3 },
            { equipmentId: doId, level: 12, blacksmithLevel: 3 },
            { equipmentId: doId, level: 13, blacksmithLevel: 5 },
            { equipmentId: doId, level: 14, blacksmithLevel: 5 },
            { equipmentId: doId, level: 15, blacksmithLevel: 5 },
            { equipmentId: doId, level: 16, blacksmithLevel: 7 },
            { equipmentId: doId, level: 17, blacksmithLevel: 7 },
            { equipmentId: doId, level: 18, blacksmithLevel: 7 },
        ]);
        // Metal Pants
        const mpId = await db.insertOne('equipment', { hero: 'Minion Prince', name: 'Metal Pants', epic: false });
        await db.insertMany('equipment_levels', [
            { equipmentId: mpId, level: 1, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 2, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 3, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 4, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 5, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 6, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 7, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 8, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 9, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 10, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 11, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 12, blacksmithLevel: 3 },
            { equipmentId: mpId, level: 13, blacksmithLevel: 5 },
            { equipmentId: mpId, level: 14, blacksmithLevel: 5 },
            { equipmentId: mpId, level: 15, blacksmithLevel: 5 },
            { equipmentId: mpId, level: 16, blacksmithLevel: 7 },
            { equipmentId: mpId, level: 17, blacksmithLevel: 7 },
            { equipmentId: mpId, level: 18, blacksmithLevel: 7 },
        ]);
        // Noble Iron
        const niId = await db.insertOne('equipment', { hero: 'Minion Prince', name: 'Noble Iron', epic: false });
        await db.insertMany('equipment_levels', [
            { equipmentId: niId, level: 1, blacksmithLevel: 5 },
            { equipmentId: niId, level: 2, blacksmithLevel: 5 },
            { equipmentId: niId, level: 3, blacksmithLevel: 5 },
            { equipmentId: niId, level: 4, blacksmithLevel: 5 },
            { equipmentId: niId, level: 5, blacksmithLevel: 5 },
            { equipmentId: niId, level: 6, blacksmithLevel: 5 },
            { equipmentId: niId, level: 7, blacksmithLevel: 5 },
            { equipmentId: niId, level: 8, blacksmithLevel: 5 },
            { equipmentId: niId, level: 9, blacksmithLevel: 5 },
            { equipmentId: niId, level: 10, blacksmithLevel: 5 },
            { equipmentId: niId, level: 11, blacksmithLevel: 5 },
            { equipmentId: niId, level: 12, blacksmithLevel: 5 },
            { equipmentId: niId, level: 13, blacksmithLevel: 5 },
            { equipmentId: niId, level: 14, blacksmithLevel: 5 },
            { equipmentId: niId, level: 15, blacksmithLevel: 5 },
            { equipmentId: niId, level: 16, blacksmithLevel: 7 },
            { equipmentId: niId, level: 17, blacksmithLevel: 7 },
            { equipmentId: niId, level: 18, blacksmithLevel: 7 },
        ]);
    });
    runStep(33, `
        ALTER TABLE users
        ADD COLUMN googleEmail VARCHAR(255) DEFAULT NULL AFTER googleId
    `);
    runStep(34, `
        CREATE TABLE army_notifications (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            recipientId INT NOT NULL,
            triggeringUserId INT DEFAULT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
            seen TIMESTAMP DEFAULT NULL,
            armyId INT NOT NULL,
            commentId INT DEFAULT NULL,
            CONSTRAINT fk_army_notifications_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_user_id FOREIGN KEY (recipientId) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_other_user_id FOREIGN KEY (triggeringUserId) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_comment_id FOREIGN KEY (commentId) REFERENCES army_comments (id) ON DELETE CASCADE
        )
    `);
    runStep(35, async (db: MySQL) => {
        // Back-insert notifications for already existing comments before army notifications were implemented
        const comments = await db.query(`
            SELECT
                ac.id,
                ac.armyId,
                ac.replyTo,
                ac.createdTime,
                ac.createdBy,
                pc.createdBy as parentCreatedBy,
                ca.createdBy as armyCreatedBy
            FROM army_comments ac
            LEFT JOIN (
                SELECT id, createdBy
                FROM army_comments
            ) pc ON pc.id = ac.replyTo
            LEFT JOIN (
                SELECT id, createdBy
                FROM armies
            ) ca ON ca.id = ac.armyId
        `, []);

        const notifications: any[] = [];

        for (const comment of comments) {
            const notification = {
                armyId: comment.armyId,
                triggeringUserId: comment.createdBy,
                commentId: comment.id,
                timestamp: comment.createdTime,
            }
            if (comment.replyTo) {
                if (comment.parentCreatedBy !== comment.createdBy) {
                    // Notify the person to which this comment is replying to (but not if replying to yourself)
                    notifications.push({ ...notification, type: 'comment-reply', recipientId: comment.parentCreatedBy })
                }
                if (comment.parentCreatedBy !== comment.armyCreatedBy && comment.createdBy !== comment.armyCreatedBy) {
                    // Notify the army creator someone commented if the reply wasn't already to the creator
                    notifications.push({ ...notification, type: 'comment', recipientId: comment.armyCreatedBy });
                }
            } else {
                if (comment.createdBy !== comment.armyCreatedBy) {
                    // Notify the army creator someone commented
                    notifications.push({ ...notification, type: 'comment', recipientId: comment.armyCreatedBy })
                }
            }
        }

        if (notifications.length) {
            await db.insertMany('army_notifications', notifications)
        }
    });
    runStep(36, `
        ALTER TABLE units
        DROP COLUMN trainingTime
    `);
    runStep(37, async (db: MySQL) => {
        // Standardize "ObjectIds" to be called "clashId".
        await db.query(`
            ALTER TABLE units
            RENAME COLUMN objectId TO clashId
        `);

        // Get rid of "object id prefix" distinction (like troops start with 4xxx), we don't care in clash armies.
        // For existing object id's in the database we should strip the prefixes this so we're left with just the ID.
        // We already know in the database that for example a troop is a "troop", so we don't need any prefix, and makes it a bit confusing to work with.
        await db.query(`
            UPDATE units
            SET clashId = COALESCE(NULLIF(REGEXP_REPLACE(clashId, '^(26|4)0+', ''), ''), '0');
        `);

        // Add clashId's for pets
        const petClashIDs = {
            "Lassi": 0,
            "Mighty Yak": 1,
            "Electro Owl": 2,
            "Unicorn": 3,
            "Phoenix": 4,
            "Poison Lizard": 7,
            "Diggy": 8,
            "Frosty": 9,
            "Spirit Fox": 10,
            "Angry Jelly": 11,
            "Sneezy": 16
        };
        await db.query('ALTER TABLE pets ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name');
        await Promise.all(Object.entries(petClashIDs).map(([name, id]) => {
            return db.query('UPDATE pets SET clashId = ? WHERE name = ?', [id, name]);
        }));

        // Add clashId's for equipment
        const equipmentClashIDs = {
            "Barbarian Puppet": 0,
            "Rage Vial": 1,
            "Archer Puppet": 2,
            "Invisibility Vial": 3,
            "Eternal Tome": 4,
            "Life Gem": 5,
            "Seeking Shield": 6,
            "Royal Gem": 7,
            "Earthquake Boots": 8,
            "Hog Rider Puppet": 9,
            "Giant Gauntlet": 10,
            "Vampstache": 11,
            "Haste Vial": 12,
            "Rocket Spear": 13,
            "Spiky Ball": 14,
            "Frozen Arrow": 15,
            "Giant Arrow": 17,
            "Healer Puppet": 20,
            "Fireball": 22,
            "Rage Gem": 24,
            "Snake Bracelet": 32,
            "Healing Tome": 34,
            "Dark Crown": 35,
            "Magic Mirror": 39,
            "Electro Boots": 40,
            "Lavaloon Puppet": 41,
            "Henchmen Puppet": 42,
            "Dark Orb": 43,
            "Metal Pants": 44,
            "Noble Iron": 47
        };
        await db.query('ALTER TABLE equipment ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name');
        await Promise.all(Object.entries(equipmentClashIDs).map(([name, id]) => {
            return db.query('UPDATE equipment SET clashId = ? WHERE name = ?', [id, name]);
        }));
    });
    runStep(38, async (db: MySQL) => {
        // Action Figure (AK)
        const afId = await db.insertOne('equipment', { hero: 'Archer Queen', name: 'Action Figure', clashId: 48, epic: true });
        await db.insertMany('equipment_levels', [
            { equipmentId: afId, level: 1, blacksmithLevel: 1 },
            { equipmentId: afId, level: 2, blacksmithLevel: 1 },
            { equipmentId: afId, level: 3, blacksmithLevel: 1 },
            { equipmentId: afId, level: 4, blacksmithLevel: 1 },
            { equipmentId: afId, level: 5, blacksmithLevel: 1 },
            { equipmentId: afId, level: 6, blacksmithLevel: 1 },
            { equipmentId: afId, level: 7, blacksmithLevel: 1 },
            { equipmentId: afId, level: 8, blacksmithLevel: 1 },
            { equipmentId: afId, level: 9, blacksmithLevel: 1 },
            { equipmentId: afId, level: 10, blacksmithLevel: 1 },
            { equipmentId: afId, level: 11, blacksmithLevel: 1 },
            { equipmentId: afId, level: 12, blacksmithLevel: 1 },
            { equipmentId: afId, level: 13, blacksmithLevel: 3 },
            { equipmentId: afId, level: 14, blacksmithLevel: 3 },
            { equipmentId: afId, level: 15, blacksmithLevel: 3 },
            { equipmentId: afId, level: 16, blacksmithLevel: 5 },
            { equipmentId: afId, level: 17, blacksmithLevel: 5 },
            { equipmentId: afId, level: 18, blacksmithLevel: 5 },
            { equipmentId: afId, level: 19, blacksmithLevel: 7 },
            { equipmentId: afId, level: 20, blacksmithLevel: 7 },
            { equipmentId: afId, level: 21, blacksmithLevel: 7 },
            { equipmentId: afId, level: 22, blacksmithLevel: 8 },
            { equipmentId: afId, level: 23, blacksmithLevel: 8 },
            { equipmentId: afId, level: 24, blacksmithLevel: 8 },
            { equipmentId: afId, level: 25, blacksmithLevel: 9 },
            { equipmentId: afId, level: 26, blacksmithLevel: 9 },
            { equipmentId: afId, level: 27, blacksmithLevel: 9 },
        ]);
    });
    runStep(39, async (db: MySQL) => {
        await db.query('UPDATE equipment SET clashId = ? WHERE name = ?', [9, 'Hog Rider Doll']);
    });
    runStep(40, async (db: MySQL) => {
        // Add new "Super Yeti" troop
        const syId = await db.insertOne('units', {
            type: 'Troop',
            name: 'Super Yeti',
            clashId: '147',
            housingSpace: 35,
            productionBuilding: 'Barrack',
            isSuper: true,
            isFlying: false,
            isJumper: false,
            airTargets: false,
            groundTargets: true,
        });
        await db.insertMany('unit_levels', [
            { unitId: syId, level: 3, barrackLevel: 14, laboratoryLevel: 1 },
            { unitId: syId, level: 4, barrackLevel: 14, laboratoryLevel: 1 },
            { unitId: syId, level: 5, barrackLevel: 14, laboratoryLevel: 1 },
            { unitId: syId, level: 6, barrackLevel: 14, laboratoryLevel: 1 },
            { unitId: syId, level: 7, barrackLevel: 14, laboratoryLevel: 1 },
        ]);
    });
}
