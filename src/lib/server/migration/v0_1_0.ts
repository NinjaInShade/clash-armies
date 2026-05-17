import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(13, `
        CREATE TABLE saved_armies (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            userId INT NOT NULL,
            CONSTRAINT fk_saved_armies_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_saved_armies_voted_by FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT unique_saved_armies_bookmark UNIQUE (armyId, userId)
        )
    `);
    runStep(14, `
        ALTER TABLE town_halls
        ADD COLUMN maxCc SMALLINT DEFAULT NULL,
        ADD COLUMN maxBlacksmith SMALLINT DEFAULT NULL,
        ADD COLUMN maxPetHouse SMALLINT DEFAULT NULL,
        ADD COLUMN maxBarbarianKing SMALLINT DEFAULT NULL,
        ADD COLUMN maxArcherQueen SMALLINT DEFAULT NULL,
        ADD COLUMN maxGrandWarden SMALLINT DEFAULT NULL,
        ADD COLUMN maxRoyalChampion SMALLINT DEFAULT NULL,
        ADD COLUMN ccLaboratoryCap SMALLINT DEFAULT 0,
        ADD COLUMN ccTroopCapacity SMALLINT DEFAULT 0,
        ADD COLUMN ccSpellCapacity SMALLINT DEFAULT 0,
        ADD COLUMN ccSiegeCapacity SMALLINT DEFAULT 0
    `);
    runStep(15, `
        ALTER TABLE army_units
        ADD COLUMN home VARCHAR(20) NOT NULL DEFAULT 'armyCamp' AFTER id
    `);
    // Unlike troops/spell/sieges, the blacksmith level dictates the max common/epic equipment level
    // As opposed to each equipment having a different max level at each blacksmith level
    runStep(16, `
        CREATE TABLE blacksmith_levels (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            level SMALLINT UNSIGNED NOT NULL,
            maxCommon SMALLINT UNSIGNED NOT NULL,
            maxEpic SMALLINT UNSIGNED NOT NULL
        )
    `);
    runStep(17, `
        CREATE TABLE equipment (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            hero VARCHAR(30) NOT NULL,
            name VARCHAR(45) NOT NULL,
            epic TINYINT(1) NOT NULL DEFAULT 0,
            CONSTRAINT unique_equipment_hero_name UNIQUE (hero, name)
        )
    `);
    runStep(18, `
        CREATE TABLE pets (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(45) NOT NULL,
            CONSTRAINT unique_pets_name UNIQUE (name)
        )
    `);
    runStep(19, `
        CREATE TABLE pet_levels (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            petId INT NOT NULL,
            level SMALLINT UNSIGNED NOT NULL,
            petHouseLevel SMALLINT DEFAULT NULL,
            CONSTRAINT fk_pet_levels_pet_id FOREIGN KEY (petId) REFERENCES pets (id) ON DELETE CASCADE
        )
    `);
    runStep(20, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(21, `
        CREATE TABLE army_equipment (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            equipmentId INT NOT NULL,
            CONSTRAINT fk_army_equipment_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_equipment_equipment_id FOREIGN KEY (equipmentId) REFERENCES equipment (id)
        )
    `);
    runStep(22, `
        CREATE TABLE army_pets (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            hero VARCHAR(30) NOT NULL,
            armyId INT NOT NULL,
            petId INT NOT NULL,
            CONSTRAINT fk_army_pets_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_pets_equipment_id FOREIGN KEY (petId) REFERENCES pets (id)
        )
    `);
}
