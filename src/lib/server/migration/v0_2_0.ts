import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
	runStep(26, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });

	runStep(27, `
        CREATE TABLE army_guides (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            -- Guide text content (in HTML format due to it being rich text)
            textContent TEXT DEFAULT NULL,
            youtubeUrl VARCHAR(75) DEFAULT NULL,
            createdTime TIMESTAMP DEFAULT NOW(),
            updatedTime TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
            CONSTRAINT fk_army_guides_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT check_army_guides_one_of_content CHECK (textContent IS NOT NULL OR youtubeUrl IS NOT NULL),
            CONSTRAINT unique_army_guides_armyId UNIQUE (armyId)
        )
    `);

	runStep(28, `
		CREATE TABLE army_comments (
			id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
			armyId INT NOT NULL,
			comment VARCHAR(512) DEFAULT NULL,
			replyTo INT DEFAULT NULL,
			createdBy INT NOT NULL,
			createdTime TIMESTAMP DEFAULT NOW(),
            updatedTime TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
			CONSTRAINT fk_army_comments_reply_to FOREIGN KEY (replyTo) REFERENCES army_comments (id) ON DELETE CASCADE,
			CONSTRAINT fk_army_comments_created_by FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_comments_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE
		)
	`);
}
