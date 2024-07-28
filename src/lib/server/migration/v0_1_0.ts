import type { MySQL, MigrationFn } from '@ninjalib/sql';
import PetLevelSeedData from './pet-levels.json';

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
    runStep(20, async (db: MySQL) => {
        // New town hall seed data for clan castle, equipment, pet and hero fields
        const ccData = [
            { maxCc: null, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 0, spells: 0, sieges: 0, labCap: 0 }, // TH1
            { maxCc: 1, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 10, spells: 0, sieges: 0, labCap: 5 }, // TH2
            { maxCc: 1, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 10, spells: 0, sieges: 0, labCap: 5 }, // TH3
            { maxCc: 2, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 15, spells: 0, sieges: 0, labCap: 6 }, // TH4
            { maxCc: 2, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 15, spells: 0, sieges: 0, labCap: 6 }, // TH5
            { maxCc: 3, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: null, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 20, spells: 0, sieges: 0, labCap: 7 }, // TH6
            { maxCc: 3, maxBlacksmith: null, maxPetHouse: null, maxBarbarianKing: 10, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 20, spells: 0, sieges: 0, labCap: 7 }, // TH7
            { maxCc: 4, maxBlacksmith: 1, maxPetHouse: null, maxBarbarianKing: 20, maxArcherQueen: null, maxGrandWarden: null, maxRoyalChampion: null, troops: 25, spells: 1, sieges: 0, labCap: 8 }, // TH8
            { maxCc: 5, maxBlacksmith: 2, maxPetHouse: null, maxBarbarianKing: 30, maxArcherQueen: 30, maxGrandWarden: null, maxRoyalChampion: null, troops: 30, spells: 1, sieges: 0, labCap: 9 }, // TH9
            { maxCc: 6, maxBlacksmith: 3, maxPetHouse: null, maxBarbarianKing: 40, maxArcherQueen: 40, maxGrandWarden: null, maxRoyalChampion: null, troops: 35, spells: 1, sieges: 1, labCap: 10 }, // TH10
            { maxCc: 7, maxBlacksmith: 4, maxPetHouse: null, maxBarbarianKing: 50, maxArcherQueen: 50, maxGrandWarden: 20, maxRoyalChampion: null, troops: 35, spells: 2, sieges: 1, labCap: 11 }, // TH11
            { maxCc: 8, maxBlacksmith: 5, maxPetHouse: null, maxBarbarianKing: 65, maxArcherQueen: 65, maxGrandWarden: 40, maxRoyalChampion: null, troops: 40, spells: 2, sieges: 1, labCap: 12 }, // TH12
            { maxCc: 9, maxBlacksmith: 6, maxPetHouse: null, maxBarbarianKing: 75, maxArcherQueen: 75, maxGrandWarden: 50, maxRoyalChampion: 25, troops: 45, spells: 2, sieges: 1, labCap: 13 }, // TH13
            { maxCc: 10, maxBlacksmith: 7, maxPetHouse: 4, maxBarbarianKing: 80, maxArcherQueen: 80, maxGrandWarden: 55, maxRoyalChampion: 30, troops: 45, spells: 3, sieges: 1, labCap: 14 }, // TH14
            { maxCc: 11, maxBlacksmith: 8, maxPetHouse: 8, maxBarbarianKing: 90, maxArcherQueen: 90, maxGrandWarden: 65, maxRoyalChampion: 40, troops: 50, spells: 3, sieges: 1, labCap: 14 }, // TH15
            { maxCc: 12, maxBlacksmith: 9, maxPetHouse: 10, maxBarbarianKing: 95, maxArcherQueen: 95, maxGrandWarden: 70, maxRoyalChampion: 45, troops: 50, spells: 3, sieges: 2, labCap: 14 }, // TH16
        ];
        await Promise.all(ccData.map((data, i) => {
            const thLevel = i + 1;
            return db.query(`
                UPDATE town_halls SET
                    maxCc = ?,
                    maxBlacksmith = ?,
                    maxPetHouse = ?,
                    maxBarbarianKing = ?,
                    maxArcherQueen = ?,
                    maxGrandWarden = ?,
                    maxRoyalChampion = ?,
                    ccLaboratoryCap = ?,
                    ccTroopCapacity = ?,
                    ccSpellCapacity = ?,
                    ccSiegeCapacity = ?
                WHERE level = ?
            `, [data.maxCc, data.maxBlacksmith, data.maxPetHouse, data.maxBarbarianKing, data.maxArcherQueen, data.maxGrandWarden, data.maxRoyalChampion, data.labCap, data.troops, data.spells, data.sieges, thLevel]);
        }));

        // Equipment seed data
        const equipment = [
            { hero: 'Barbarian King', name: 'Barbarian Puppet', epic: false },
            { hero: 'Barbarian King', name: 'Spiky Ball', epic: true },
            { hero: 'Barbarian King', name: 'Vampstache', epic: false },
            { hero: 'Barbarian King', name: 'Earthquake Boots', epic: false },
            { hero: 'Barbarian King', name: 'Rage Vial', epic: false },
            { hero: 'Barbarian King', name: 'Giant Gauntlet', epic: true },
            { hero: 'Archer Queen', name: 'Archer Puppet', epic: false },
            { hero: 'Archer Queen', name: 'Giant Arrow', epic: false },
            { hero: 'Archer Queen', name: 'Frozen Arrow', epic: true },
            { hero: 'Archer Queen', name: 'Invisibility Vial', epic: false },
            { hero: 'Archer Queen', name: 'Healer Puppet', epic: false },
            { hero: 'Grand Warden', name: 'Eternal Tome', epic: false },
            { hero: 'Grand Warden', name: 'Rage Gem', epic: false },
            { hero: 'Grand Warden', name: 'Healing Tome', epic: false },
            { hero: 'Grand Warden', name: 'Life Gem', epic: false },
            { hero: 'Grand Warden', name: 'Fireball', epic: true },
            { hero: 'Royal Champion', name: 'Royal Gem', epic: false },
            { hero: 'Royal Champion', name: 'Rocket Spear', epic: true },
            { hero: 'Royal Champion', name: 'Haste Vial', epic: false },
            { hero: 'Royal Champion', name: 'Seeking Shield', epic: false },
            { hero: 'Royal Champion', name: 'Hog Rider Doll', epic: false },
        ];
        // Blacksmith dictates max common/epic equipment levels so no need for an `equipment_levels` table!
        const blacksmithLevels = [
            { level: 1, maxCommon: 9, maxEpic: 12 },
            { level: 2, maxCommon: 9, maxEpic: 12 },
            { level: 3, maxCommon: 12, maxEpic: 15 },
            { level: 4, maxCommon: 12, maxEpic: 15 },
            { level: 5, maxCommon: 15, maxEpic: 18 },
            { level: 6, maxCommon: 15, maxEpic: 18 },
            { level: 7, maxCommon: 18, maxEpic: 21 },
            { level: 8, maxCommon: 18, maxEpic: 24 },
            { level: 9, maxCommon: 18, maxEpic: 27 },
        ];
        await db.insertMany('equipment', equipment);
        await db.insertMany('blacksmith_levels', blacksmithLevels);

        // Pets seed data
        const pets = [
            { name: 'Lassi' },
            { name: 'Electro Owl' },
            { name: 'Mighty Yak' },
            { name: 'Unicorn' },
            { name: 'Frosty' },
            { name: 'Diggy' },
            { name: 'Poison Lizard' },
            { name: 'Phoenix' },
            { name: 'Spirit Fox' },
            { name: 'Angry Jelly' },
        ];
        for (const pet of pets) {
            const petId = await db.insertOne('pets', pet);
            const levels = PetLevelSeedData[pet.name].map(lvl => ({ ...lvl, petId }));
            await db.insertMany('pet_levels', levels);
        }
    });
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
