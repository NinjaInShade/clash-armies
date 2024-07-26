import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(12, async (db: MySQL) => {
        // New dark barracks level 11 unlocked for town halls 14 and above
        await db.query(`
            UPDATE town_halls
                SET maxDarkBarracks = 11
            WHERE level >= 14
        `);

        // Insert unit data for new "druid" troop
        const unitId = await db.insertOne('units', {
            type: 'Troop',
            name: 'Druid',
            objectId: 40000123,
            housingSpace: 16,
            trainingTime: 150,
            productionBuilding: 'Dark Elixir Barrack',
            airTargets: true,
            groundTargets: true
        });
        // Insert levels
        await db.insertMany('unit_levels', [
            { unitId, level: 1, barrackLevel: 11, laboratoryLevel: null },
            { unitId, level: 2, barrackLevel: 11, laboratoryLevel: 12 },
            { unitId, level: 3, barrackLevel: 11, laboratoryLevel: 13 },
            { unitId, level: 4, barrackLevel: 11, laboratoryLevel: 14 },
        ]);
    });
}
