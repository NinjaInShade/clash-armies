import type { PageServerLoad } from './$types';
import type { Server } from '$server/api/Server';
import fsp from 'node:fs/promises';
import os from 'node:os';

export const load: PageServerLoad = async (req) => {
	req.locals.requireRoles('admin');
	req.setHeaders({
		'Cache-Control': 'no-store',
	});

	const { server } = req.locals;
	const stats = await getServerStats(server);
	const appStats = await getAppStats(server);

	return {
		serverStats: stats,
		appStats,
		units: server.army.units,
		townHalls: server.army.townHalls,
	};
};

async function getAppStats(server: Server) {
	const [usersResult, armiesResult, commentsResult, armiesByTHResult] = await Promise.all([
		server.db.query<{ count: number }>('SELECT COUNT(*) as count FROM users'),
		server.db.query<{ count: number }>('SELECT COUNT(*) as count FROM armies'),
		server.db.query<{ count: number }>('SELECT COUNT(*) as count FROM army_comments'),
		server.db.query<{ townHall: number; count: number }>(
			'SELECT townHall, COUNT(*) as count FROM armies GROUP BY townHall ORDER BY townHall ASC'
		),
	]);

	return {
		totalUsers: usersResult[0]?.count ?? 0,
		totalArmies: armiesResult[0]?.count ?? 0,
		totalComments: commentsResult[0]?.count ?? 0,
		armiesByTownHall: armiesByTHResult,
	};
}

// TODO: move this to a dedicated server subclass at some point
async function getServerStats(server: Server) {
	let usedDisk = '0';
	let totalDisk = '0';

	try {
		const { used, total } = await getDiskUsage();
		usedDisk = used;
		totalDisk = total;
	} catch (err) {
		server.log.error('Failed to get disk usage:', err);
	}

	const usedMemory = getUsedMemory();
	const totalMemory = getTotalMemory();

	return {
		usedMemory,
		totalMemory,
		usedDisk,
		totalDisk,
	};
}

async function getDiskUsage() {
	const stats = await fsp.statfs('/');

	const total = stats.blocks * stats.bsize;
	const free = stats.bfree * stats.bsize;
	const used = total - free;

	return {
		total: formatBytesToGB(total),
		used: formatBytesToGB(used),
	};
}

/**
 * Get  used system memory in GB to fixed 1 DP
 */
function getUsedMemory() {
	return formatBytesToGB(os.totalmem() - os.freemem());
}

/**
 * Get total system memory in GB to fixed 1 DP
 */
function getTotalMemory() {
	return formatBytesToGB(os.totalmem());
}

function formatBytesToGB(value: number) {
	return (value / 1024 ** 3).toFixed(1);
}
