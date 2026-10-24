import fsp from 'node:fs/promises';
import os from 'node:os';
import type { MetricWeights } from '#server/api/ArmyMetricsAPI.ts';
import type { Server } from '#server/api/Server.ts';
import type { Unit, TownHall } from '#shared/gameData.ts';
import { DAY, HOUR, MINUTE, SECOND } from '#shared/utils.ts';
import type { PageServerLoad } from './$types';

/** General stats about the application */
export type AppStats = {
	totalUsers: number;
	totalArmies: number;
	totalComments: number;
	armiesByTownHall: { townHall: number; count: number }[];
	units: Unit[];
	townHalls: TownHall[];
	metricWeights: MetricWeights;
};

/** Stats about the running process */
export type ProcessStats = {
	rss: string;
	uptime: string;
	nodeVersion: string;
};

/** Stats about the physical server */
export type ServerStats = {
	usedDisk: string;
	totalDisk: string;
	usedMemory: string;
	totalMemory: string;
};

export const load: PageServerLoad = async (req) => {
	req.locals.requireRoles('admin');
	req.setHeaders({
		'Cache-Control': 'no-store',
	});

	const { server } = req.locals;

	const appStats = await getAppStats(server);
	const serverStats = await getServerStats(server);
	const processStats = await getProcessStats();

	return {
		appStats,
		serverStats,
		processStats,
	};
};

async function getAppStats(server: Server) {
	const [usersResult, armiesResult, commentsResult, armiesByTHResult] = await Promise.all([
		server.db
			.selectFrom('users')
			.select((eb) => eb.fn.countAll().as('count'))
			.execute(),
		server.db
			.selectFrom('armies')
			.select((eb) => eb.fn.countAll().as('count'))
			.execute(),
		server.db
			.selectFrom('army_comments')
			.select((eb) => eb.fn.countAll().as('count'))
			.execute(),
		server.db
			.selectFrom('armies')
			.select((eb) => ['townHall', eb.fn.countAll().as('count')])
			.groupBy('townHall')
			.orderBy('townHall', 'asc')
			.execute(),
	]);

	return {
		totalUsers: usersResult[0]?.count ?? 0,
		totalArmies: armiesResult[0]?.count ?? 0,
		totalComments: commentsResult[0]?.count ?? 0,
		armiesByTownHall: armiesByTHResult,
		units: server.gameData.units,
		townHalls: server.gameData.townHalls,
		metricWeights: server.army.metrics.metricWeights,
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

async function getProcessStats() {
	return {
		rss: formatBytesToMB(process.memoryUsage.rss()),
		uptime: formatUptime(process.uptime() * SECOND),
		nodeVersion: process.version,
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

function formatBytesToMB(value: number) {
	return (value / 1024 ** 2).toFixed(0);
}

function formatUptime(ms: number) {
	const days = Math.floor(ms / DAY);
	const hours = Math.floor((ms % DAY) / HOUR);
	const minutes = Math.floor((ms % HOUR) / MINUTE);
	if (days) {
		return `${days}d ${hours}h`;
	} else if (hours) {
		return `${hours}h ${minutes}m`;
	} else {
		return `${minutes}m`;
	}
}
