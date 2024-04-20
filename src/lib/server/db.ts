import { DB_USER, DB_PASSWORD, DB_PORT } from '$env/static/private';
import { MySQL } from '@ninjalib/sql';

export const db = new MySQL({
	user: DB_USER,
	password: DB_PASSWORD,
	port: +DB_PORT,
	database: 'clash-armies',
	typeCast: function(field, next) {
		if (field.type === 'TINY' && field.length === 1) {
			return field.string() === '1'; // 1 = true, 0 = false
		}
		return next();
	}
});
