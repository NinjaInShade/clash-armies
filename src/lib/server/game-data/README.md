# Game data

Declarative source of truth for Clash of Clans static reference data - town halls, heroes, troops, spells, sieges, pets, and equipment.

The `game-data.json5` file is read on server startup, after migrations have ran, and syncs the data into the database. Having unit information in the database (not army units, but the base data) is beneficial, providing safety through foreign key constraints and being easily queryable if that was desired. 

Historically when the app needed to add new units or levels (etc), a database migration would need to be ran each time. The game data file aims to make that nicer, and has various benefits:

- Decouples data from schema
- Easier to compare existing units/levels
- Easier to view the version control history of how the data has evolved

## Files

- **`game-data.json5`** - the data itself, hand-editable and *generally* the only file you touch when game updates ship.
- **`schema.ts`** - zod schemas which validates `game-data.json5` at server startup - also providing a TS types for the data shape.
- **`GameData.ts`** - the game data API class:
    - syncs file->DB: reads `game-data.json5`, hashes content and upserts into the DB. Runs on every server startup as part of `Server.init()` (right after migrations) - skipped if the file hasn't changed since the last sync.
    - loads game data and provides various getters and convenient properties for usage throughout the app

## Slug rules

Display names go into the file as-is (`'Barbarian King'`, not `'barbarian-king'`). URL slugs are derived at runtime via `encodeUnitName()`.

If a name has special characters, such as P.E.K.K.A, `encodeUnitName()` may need extending - check there.
