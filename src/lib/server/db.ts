import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Kysely, MysqlDialect, sql, type InsertObject } from 'kysely';
import { createPool } from 'mysql2';
import type { DB } from './db-types.d.ts';
import { logger } from './logger';

const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT } = env;

const log = logger('clash-armies:db');

if (!building) {
	if (typeof DB_USER !== 'string') {
		throw new Error('Expected database user to be defined');
	}
	if (typeof DB_PASSWORD !== 'string') {
		throw new Error('Expected database password to be defined');
	}
	if (DB_PORT && Number.isNaN(+DB_PORT)) {
		throw new Error('Expected database port to be a valid number');
	}
}

const dialect = new MysqlDialect({
	pool: createPool({
		user: DB_USER,
		password: DB_PASSWORD,
		host: DB_HOST ?? 'localhost',
		port: DB_PORT ? +DB_PORT : 3306,
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
	jsonAgg(col: string, orderBy?: { order: string; dir?: 'ASC' | 'DESC' }) {
		const orderByClause = orderBy ? sql` ORDER BY ${sql.ref(orderBy.order)} ${sql.raw(orderBy.dir ?? 'ASC')}` : sql``;
		return sql`JSON_ARRAYAGG(${sql.ref(col)}${orderByClause})`;
	},
	jsonAggObj(obj: Record<string, string>, orderBy?: { order: string; dir?: 'ASC' | 'DESC' }) {
		const pairs = Object.entries(obj).map(([key, col]) => sql`'${sql.raw(key)}', ${sql.ref(col)}`);
		const orderByClause = orderBy ? sql` ORDER BY ${sql.ref(orderBy.order)} ${sql.raw(orderBy.dir ?? 'ASC')}` : sql``;
		return sql`JSON_ARRAYAGG(JSON_OBJECT(${sql.join(pairs, sql`,`)})${orderByClause})`;
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

export async function waitForDatabase(db: Database): Promise<void> {
	const maxAttempts = 20;
	const delayMs = 500;

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
