import type { MigrationFn } from './migrator';

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
    runStep(3, `
        CREATE TABLE army_units (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            name VARCHAR(45) NOT NULL,
            amount SMALLINT UNSIGNED NOT NULL,
            CONSTRAINT fk_army_units_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE
        )
    `);
    runStep(4, `
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
