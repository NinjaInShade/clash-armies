import type { MySQL, MigrationFn } from '@ninjalib/sql';

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
        ADD COLUMN ccLaboratoryCap SMALLINT DEFAULT 0,
        ADD COLUMN ccTroopCapacity SMALLINT DEFAULT 0,
        ADD COLUMN ccSpellCapacity SMALLINT DEFAULT 0,
        ADD COLUMN ccSiegeCapacity SMALLINT DEFAULT 0
    `);
    runStep(15, `
        ALTER TABLE army_units
        ADD COLUMN home VARCHAR(20) NOT NULL DEFAULT 'armyCamp' AFTER id
    `);
    runStep(16, async (db: MySQL) => {
        const ccData = [
            { maxCc: null, troops: 0, spells: 0, sieges: 0, labCap: 0 }, // TH1
            { maxCc: 1, troops: 10, spells: 0, sieges: 0, labCap: 5 }, // TH2
            { maxCc: 1, troops: 10, spells: 0, sieges: 0, labCap: 5 }, // TH3
            { maxCc: 2, troops: 15, spells: 0, sieges: 0, labCap: 6 }, // TH4
            { maxCc: 2, troops: 15, spells: 0, sieges: 0, labCap: 6 }, // TH5
            { maxCc: 3, troops: 20, spells: 0, sieges: 0, labCap: 7 }, // TH6
            { maxCc: 3, troops: 20, spells: 0, sieges: 0, labCap: 7 }, // TH7
            { maxCc: 4, troops: 25, spells: 1, sieges: 0, labCap: 8 }, // TH8
            { maxCc: 5, troops: 30, spells: 1, sieges: 0, labCap: 9 }, // TH9
            { maxCc: 6, troops: 35, spells: 1, sieges: 1, labCap: 10 }, // TH10
            { maxCc: 7, troops: 35, spells: 2, sieges: 1, labCap: 11 }, // TH11
            { maxCc: 8, troops: 40, spells: 2, sieges: 1, labCap: 12 }, // TH12
            { maxCc: 9, troops: 45, spells: 2, sieges: 1, labCap: 13 }, // TH13
            { maxCc: 10, troops: 45, spells: 3, sieges: 1, labCap: 14 }, // TH14
            { maxCc: 11, troops: 50, spells: 3, sieges: 1, labCap: 14 }, // TH15
            { maxCc: 12, troops: 50, spells: 3, sieges: 2, labCap: 14 }, // TH16
        ];
        await Promise.all(ccData.map((data, i) => {
            const thLevel = i + 1;
            return db.query(`
                UPDATE town_halls SET
                    maxCc = ?,
                    ccLaboratoryCap = ?,
                    ccTroopCapacity = ?,
                    ccSpellCapacity = ?,
                    ccSiegeCapacity = ?
                WHERE level = ?
            `, [data.maxCc, data.labCap, data.troops, data.spells, data.sieges, thLevel]);
        }));
    });
}
