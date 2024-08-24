import type { MySQL, MigrationFn } from '@ninjalib/sql';

export default function migration(runStep: MigrationFn) {
	runStep(26, async (db: MySQL) => {
		// Insert data for new "Magic Mirror" equipment
		const equipmentId = await db.insertOne('equipment', {
			hero: 'Archer Queen',
			name: 'Magic Mirror',
			epic: 1,
		});
		// Insert levels
		await db.insertMany('equipment_levels', [
			{
				equipmentId,
				level: 1,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 2,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 3,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 4,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 5,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 6,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 7,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 8,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 9,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 10,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 11,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 12,
				blacksmithLevel: 1,
			},
			{
				equipmentId,
				level: 13,
				blacksmithLevel: 3,
			},
			{
				equipmentId,
				level: 14,
				blacksmithLevel: 3,
			},
			{
				equipmentId,
				level: 15,
				blacksmithLevel: 3,
			},
			{
				equipmentId,
				level: 16,
				blacksmithLevel: 5,
			},
			{
				equipmentId,
				level: 17,
				blacksmithLevel: 5,
			},
			{
				equipmentId,
				level: 18,
				blacksmithLevel: 5,
			},
			{
				equipmentId,
				level: 19,
				blacksmithLevel: 7,
			},
			{
				equipmentId,
				level: 20,
				blacksmithLevel: 7,
			},
			{
				equipmentId,
				level: 21,
				blacksmithLevel: 7,
			},
			{
				equipmentId,
				level: 22,
				blacksmithLevel: 8,
			},
			{
				equipmentId,
				level: 23,
				blacksmithLevel: 8,
			},
			{
				equipmentId,
				level: 24,
				blacksmithLevel: 8,
			},
			{
				equipmentId,
				level: 25,
				blacksmithLevel: 9,
			},
			{
				equipmentId,
				level: 26,
				blacksmithLevel: 9,
			},
			{
				equipmentId,
				level: 27,
				blacksmithLevel: 9,
			},
		]);
	});
}
