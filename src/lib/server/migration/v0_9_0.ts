import { sql } from 'kysely';
import type { Database } from '$server/db';
import type { MigrationFn } from '$server/migration/migrator';
import type { Unit, Equipment } from '$types';

// Mapping from old `town_halls` hero columns -> hero name.
// Used to flatten denormalized columns into `town_hall_heroes_max`.
const TH_HERO_COLUMNS = [
	{ column: 'maxBarbarianKing', name: 'Barbarian King' },
	{ column: 'maxArcherQueen', name: 'Archer Queen' },
	{ column: 'maxGrandWarden', name: 'Grand Warden' },
	{ column: 'maxRoyalChampion', name: 'Royal Champion' },
	{ column: 'maxMinionPrince', name: 'Minion Prince' },
	{ column: 'maxDragonDuke', name: 'Dragon Duke' },
];

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    // 0) Fix existing bad data in prepartion for UNIQUE constraints in migration 71.
    // NOTE: some of the queries below got guards added due to purging historical migrations.
    // These queries still stay in case someone actually had that bad data, otherwise the
    // upcoming UNIQUE constraint migration could fail - see 768be65 for more information.
    runStep(64, async (db: Database) => {
        // In the `v0_5_0.ts` migration file, a duplicate unit level was added for the "Ice Block" spell.
        // Remove this duplicate entry so the constraints can be made - for exactly this reason.
       	const iceBlock = await db.selectFrom('units').where('name', '=', 'Ice Block').select('id').executeTakeFirst();
    	if (iceBlock) {
    		await db.deleteFrom('unit_levels').where('unitId', '=', iceBlock.id).where('level', '=', 4).where('laboratoryLevel', '=', 15).execute();
    	}

        // Migration v0_1_1 inserted a duplicate level 5 row and missed a level 2 row for these equipment.
    	const equipmentFixes = [
    		{ name: 'Healer Puppet', level2BlacksmithLevel: 5 },
    		{ name: 'Rage Gem', level2BlacksmithLevel: 4 },
    		{ name: 'Healing Tome', level2BlacksmithLevel: 6 },
    		{ name: 'Haste Vial', level2BlacksmithLevel: 8 },
    		{ name: 'Hog Rider Doll', level2BlacksmithLevel: 7 },
    	];
    	for (const fix of equipmentFixes) {
    		const eq = await db.selectFrom('equipment').where('name', '=', fix.name).select('id').executeTakeFirst();
    		if (eq) {
    			await sql`DELETE FROM equipment_levels WHERE equipmentId = ${eq.id} AND level = 5 LIMIT 1`.execute(db);
    			await db.insertInto('equipment_levels').values({ equipmentId: eq.id, level: 2, blacksmithLevel: fix.level2BlacksmithLevel }).execute();
    		}
    	}
    });
    // 1) Heroes as a first-class entity.
    runStep(65, async (db: Database) => {
        await sql`
    		CREATE TABLE heroes (
    			name VARCHAR(30) NOT NULL PRIMARY KEY,
    			clashId INT UNSIGNED NOT NULL
    		)
    	`.execute(db);

        await db
    		.insertInto('heroes')
    		.values([
    			{ name: 'Barbarian King', clashId: 0 },
    			{ name: 'Archer Queen', clashId: 1 },
    			{ name: 'Grand Warden', clashId: 2 },
    			{ name: 'Royal Champion', clashId: 4 },
    			{ name: 'Minion Prince', clashId: 6 },
    			{ name: 'Dragon Duke', clashId: 7 },
    		])
    		.execute();
	});
	// 2) Town hall -> hero max levels join table.
	// Replaces the `maxBarbarianKing`/`maxArcherQueen`/etc... columns on town_halls.
	// This decouples data updates from schema updates.
    runStep(66, async (db: Database) => {
        await sql`
    		CREATE TABLE town_hall_heroes_max (
    			townHall SMALLINT UNSIGNED NOT NULL,
    			heroName VARCHAR(30) NOT NULL,
    			maxLevel SMALLINT UNSIGNED NOT NULL,
    			PRIMARY KEY (townHall, heroName),
    			CONSTRAINT fk_town_hall_heroes_max_town_hall FOREIGN KEY (townHall) REFERENCES town_halls (level),
    			CONSTRAINT fk_town_hall_heroes_max_hero FOREIGN KEY (heroName) REFERENCES heroes (name)
    		)
    	`.execute(db);
		// Populate `town_hall_heroes_max` from the columns on current `town_halls`.
		const cols = TH_HERO_COLUMNS.map((c) => c.column).join(', ');
		const { rows } = await sql<Record<string, number | null>>`
			SELECT level, ${sql.raw(cols)} FROM town_halls
		`.execute(db);

		const inserts: { townHall: number; heroName: string; maxLevel: number }[] = [];
		for (const row of rows) {
			for (const { column, name } of TH_HERO_COLUMNS) {
				const max = row[column];
				if (max != null) {
                    inserts.push({
                        townHall: row.level as number,
                        heroName: name,
                        maxLevel: max,
                    });
				}
			}
		}
		if (inserts.length) {
			await db.insertInto('town_hall_heroes_max').values(inserts).execute();
		}
	});
	// 3) Collapse `unit_levels` `barrackLevel`/`spellFactoryLevel` -> `buildingLevel`.
	// laboratoryLevel stays, it's the upgrade requirement so a separate concern.
    runStep(67, async (db: Database) => {
        await sql`
            ALTER TABLE unit_levels
            ADD COLUMN buildingLevel SMALLINT DEFAULT NULL AFTER level
        `.execute(db)
        await sql`
            UPDATE unit_levels
            SET buildingLevel = COALESCE(barrackLevel, spellFactoryLevel)
        `.execute(db)
    });
	// 4) Add FK constraints on `equipment.hero` and `army_pets.hero`.
    runStep(68, async (db: Database) => {
        await sql`
            ALTER TABLE equipment
            ADD CONSTRAINT fk_equipment_hero FOREIGN KEY (hero) REFERENCES heroes (name)
        `.execute(db)
        await sql`
            ALTER TABLE army_pets
            ADD CONSTRAINT fk_army_pets_hero FOREIGN KEY (hero) REFERENCES heroes (name)
        `.execute(db)
    });
    // 5) Drop (now) obsolete columns.
    runStep(69, async (db: Database) => {
        await sql`
            ALTER TABLE town_halls
            DROP COLUMN maxBarbarianKing,
            DROP COLUMN maxArcherQueen,
            DROP COLUMN maxGrandWarden,
            DROP COLUMN maxRoyalChampion,
            DROP COLUMN maxMinionPrince,
            DROP COLUMN maxDragonDuke
        `.execute(db)
        await sql`
            ALTER TABLE unit_levels
            DROP COLUMN barrackLevel,
            DROP COLUMN spellFactoryLevel
        `.execute(db)
    });
	// 6) Create sync state table - single row holds the hash of the last-applied data file.
	runStep(70, `
	    CREATE TABLE game_data_sync (
		    id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
			hash VARCHAR(64) NOT NULL,
			appliedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
			CHECK (id = 1)
		)
	`);
	// 7) UNIQUE constraints on for each levels table.
	// Makes syncing added/updated levels much easier, since we can just upsert.
	// Also a defensive measure to prevent accidental duplicate level rows.
    runStep(71, async (db: Database) => {
        await sql`ALTER TABLE unit_levels ADD CONSTRAINT unique_unit_levels_unit_level UNIQUE (unitId, level)`.execute(db);
        await sql`ALTER TABLE pet_levels ADD CONSTRAINT unique_pet_levels_pet_level UNIQUE (petId, level)`.execute(db);
        await sql`ALTER TABLE equipment_levels ADD CONSTRAINT unique_equipment_levels_equipment_level UNIQUE (equipmentId, level)`.execute(db);
    });
    // 8) Add `order` columns to applicable tables so that game data file
    // can decide the UI order (natural order when upserting during sync isn't reliable).
    runStep(72, async (db: Database) => {
        // Orders start as 0 but game data sync will update this on startup.
        await sql`ALTER TABLE heroes ADD COLUMN \`order\` INT NOT NULL DEFAULT 0`.execute(db);
        await sql`ALTER TABLE units ADD COLUMN \`order\` INT NOT NULL DEFAULT 0`.execute(db);
        await sql`ALTER TABLE pets ADD COLUMN \`order\` INT NOT NULL DEFAULT 0`.execute(db);
        await sql`ALTER TABLE equipment ADD COLUMN \`order\` INT NOT NULL DEFAULT 0`.execute(db);
    })
}
