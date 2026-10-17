import { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT } from '$app/env/private';
import { Kysely, MysqlDialect, sql, type InsertObject } from 'kysely';
import { createPool } from 'mysql2';
import type { DB } from './db-types.d.ts';
import { logger } from './logger';

const log = logger('clash-armies:db');

const dialect = new MysqlDialect({
	pool: createPool({
		user: DB_USER,
		password: DB_PASSWORD,
		host: DB_HOST ?? 'localhost',
		port: DB_PORT ?? 3306,
		database: 'clash-armies',
		timezone: 'Z',
		typeCast(field, next) {
			if (field.type === 'TINY' && field.length === 1) {
				return field.string() === '1';
			}
			return next();
		},
	}),
});

export type Database = Kysely<DB>;

export const db = new Kysely<DB>({ dialect });

export const helpers = {
	/**
	 * DANGER: uses sql.raw so make sure interval is not user-provided
	 */
	ago(interval: string) {
		return sql<Date>`NOW() - INTERVAL ${sql.raw(interval)}`;
	},
	jsonAgg<T = unknown>(col: string, orderBy?: { order: string; dir?: 'ASC' | 'DESC' }) {
		const orderByClause = orderBy ? sql` ORDER BY ${sql.ref(orderBy.order)} ${sql.raw(orderBy.dir ?? 'ASC')}` : sql``;
		return sql<T[]>`JSON_ARRAYAGG(${sql.ref(col)}${orderByClause})`;
	},
	jsonAggObj<T = unknown>(obj: Record<string, string>, orderBy?: { order: string; dir?: 'ASC' | 'DESC' }) {
		const pairs = Object.entries(obj).map(([key, col]) => sql`'${sql.raw(key)}', ${sql.ref(col)}`);
		const orderByClause = orderBy ? sql` ORDER BY ${sql.ref(orderBy.order)} ${sql.raw(orderBy.dir ?? 'ASC')}` : sql``;
		return sql<T[]>`JSON_ARRAYAGG(JSON_OBJECT(${sql.join(pairs, sql`,`)})${orderByClause})`;
	},
	async upsert<TB extends keyof DB & string>(db: Kysely<DB>, table: TB, rows: InsertObject<DB, TB> | InsertObject<DB, TB>[]) {
		const data = Array.isArray(rows) ? rows : [rows];
		if (!data.length) {
			return;
		}
		const allKeys = Object.keys(data[0]);
		const updates = Object.fromEntries(allKeys.map((k) => [k, sql`VALUES(${sql.ref(k)})`]));
		await db.insertInto(table).values(data).onDuplicateKeyUpdate(updates).execute();
	},
};

type WaitForDatabaseOpts = {
	maxAttempts?: number;
	delayMs?: number;
};

export async function waitForDatabase(db: Database, opts: WaitForDatabaseOpts = {}): Promise<void> {
	const { maxAttempts = 20, delayMs = 500 } = opts;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await sql`SELECT 1`.execute(db);
			return;
		} catch {
			if (attempt === maxAttempts) {
				throw new Error(`Database did not become available after ${(maxAttempts * delayMs) / 1000}s`);
			}
			log.info(`Waiting for database... (attempt ${attempt}/${maxAttempts})`);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}
