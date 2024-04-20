import { SECOND, MINUTE, HOUR } from '~/lib/constants';

/**
 * @param time: the time to format in miliseconds
 * @returns formatted time string e.g. '1m 20s'
 */
export function formatTime(time: number) {
	const parts: string[] = [];

	if (time >= HOUR) {
		const hours = Math.floor(time / HOUR);
		parts.push(`${hours}h`);
		time -= hours * HOUR;
	}
	if (time >= MINUTE) {
		const mins = Math.floor(time / MINUTE);
		parts.push(`${mins}m`);
		time -= mins * MINUTE;
	}
	if (time >= SECOND) {
		const secs = Math.floor(time / SECOND);
		parts.push(`${secs}s`);
		time -= secs * SECOND;
	}
	if (time > 0) {
		throw new Error(`Unexpected time left over after formatting: "${time}"`);
	}

	return parts.length ? parts.join(' ') : '0s';
}

type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];
export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

export function openLink(href: string, openInNewTab = true) {
	window.open(href, openInNewTab ? '_blank' : undefined, 'rel="noreferrer"');
}
