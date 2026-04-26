import { env } from '$env/dynamic/private';
import { MySQL } from '@ninjalib/sql';
import { building } from '$app/environment';

const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT } = env;

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

export const db = new MySQL({
	host: DB_HOST ?? 'localhost',
	user: DB_USER,
	password: DB_PASSWORD,
	port: DB_PORT ? +DB_PORT : 3306,
	database: 'clash-armies',
	typeCast: function (field, next) {
		if (field.type === 'TINY' && field.length === 1) {
			const str = field.string();
			if (str === null) {
				return null;
			} else if (str === '0') {
				return false;
			} else if (str === '1') {
				return true;
			} else {
				return +str;
			}
		}
		return next();
	},
	timezone: 'Z',
});
