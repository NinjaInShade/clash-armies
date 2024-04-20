import type { MigrationFn } from './migrator';
import { insertInitialTownHalls, insertInitialUnits } from "./migration-utils";

// prettier-ignore
export function migration(runStep: MigrationFn) {
    runStep(1, `
        CREATE TABLE users (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(45) NOT NULL,
            playerTag VARCHAR(20) DEFAULT NULL
        )
    `);
    runStep(2, `
        CREATE TABLE units (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(20) NOT NULL,
            name VARCHAR(45) NOT NULL,
            objectId INT UNSIGNED NOT NULL,
            housingSpace SMALLINT UNSIGNED NOT NULL,
            trainingTime SMALLINT UNSIGNED NOT NULL,
            productionBuilding VARCHAR(75) NOT NULL,
            isSuper TINYINT(1) NOT NULL DEFAULT 0,
            isFlying TINYINT(1) NOT NULL DEFAULT 0,
            isJumper TINYINT(1) NOT NULL DEFAULT 0,
            airTargets TINYINT(1) NOT NULL DEFAULT 0,
            groundTargets TINYINT(1) NOT NULL DEFAULT 0,
            CONSTRAINT unique_units_type_name UNIQUE (type, name)
        )
    `);
    runStep(3, `
        CREATE TABLE unit_levels (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            unitId INT NOT NULL,
            level SMALLINT UNSIGNED NOT NULL,
            spellFactoryLevel SMALLINT DEFAULT NULL,
            barrackLevel SMALLINT DEFAULT NULL,
            laboratoryLevel SMALLINT DEFAULT NULL,
            CONSTRAINT fk_unit_levels_unit_id FOREIGN KEY (unitId) REFERENCES units (id)
        )
    `);
    runStep(4, `
        CREATE TABLE town_halls (
            level SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
            maxBarracks SMALLINT DEFAULT NULL,
            maxDarkBarracks SMALLINT DEFAULT NULL,
            maxLaboratory SMALLINT DEFAULT NULL,
            maxSpellFactory SMALLINT DEFAULT NULL,
            maxDarkSpellFactory SMALLINT DEFAULT NULL,
            maxWorkshop SMALLINT DEFAULT NULL,
            troopCapacity SMALLINT,
            spellCapacity SMALLINT,
            siegeCapacity SMALLINT
        )
    `);
    runStep(5, async (db) => {
        // Insert initial town hall seed data
        await insertInitialTownHalls(db);
    })
    runStep(6, async (db) => {
        // Insert initial units seed data
        await insertInitialUnits(db);
    }),
    runStep(7, `
        CREATE TABLE armies (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(75) NOT NULL,
            townHall TINYINT UNSIGNED NOT NULL,
            banner VARCHAR(255) NOT NULL,
            createdBy INT NOT NULL,
            createdTime TIMESTAMP DEFAULT NOW(),
            updatedTime TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
            CONSTRAINT fk_armies_created_by FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    runStep(8, `
        CREATE TABLE army_units (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            unitId INT NOT NULL,
            amount SMALLINT UNSIGNED NOT NULL,
            CONSTRAINT fk_army_units_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_units_unit_id FOREIGN KEY (unitId) REFERENCES units (id)
        )
    `);
    runStep(9, `
        CREATE TABLE army_votes (
            armyId INT NOT NULL,
            votedBy INT NOT NULL,
            vote TINYINT NOT NULL,
            PRIMARY KEY (armyId, votedBy),
            CONSTRAINT fk_army_votes_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_votes_voted_by FOREIGN KEY (votedBy) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT army_votes_vote_value CHECK (vote = -1 OR vote = 1)
        )
    `)
}
