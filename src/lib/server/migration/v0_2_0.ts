import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(26, `
        CREATE TABLE army_guides (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            -- Rich text HTML encoded guide text content (validated server-side before saving)
            textContent TEXT DEFAULT NULL,
            youtubeUrl VARCHAR(75) DEFAULT NULL,
            createdTime TIMESTAMP DEFAULT NOW(),
            updatedTime TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
            CONSTRAINT fk_army_guides_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT check_army_guides_one_of_content CHECK (textContent IS NOT NULL OR youtubeUrl IS NOT NULL),
            CONSTRAINT unique_army_guides_armyId UNIQUE (armyId)
        )
    `);
}
