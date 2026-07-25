/**
 * A key:value of which regular troop corresponds to the super version.
 * This is required as some don't just have "Super" prefixed, e.g. "Rocket Balloon" -> "Balloon".
 */
export const SUPER_TO_REGULAR: Record<string, string> = {
	'Super Barbarian': 'Barbarian',
	'Super Archer': 'Archer',
	'Sneaky Goblin': 'Goblin',
	'Super Wall Breaker': 'Wall Breaker',
	'Super Giant': 'Giant',
	'Rocket Balloon': 'Balloon',
	'Super Wizard': 'Wizard',
	'Super Dragon': 'Dragon',
	'Inferno Dragon': 'Baby Dragon',
	'Super Minion': 'Minion',
	'Super Valkyrie': 'Valkyrie',
	'Super Witch': 'Witch',
	'Ice Hound': 'Lava Hound',
	'Super Bowler': 'Bowler',
	'Super Miner': 'Miner',
	'Super Hog Rider': 'Hog Rider',
	'Super Yeti': 'Yeti',
};

export const ARMY_EDIT_FILLER = 14;
export const HOLD_ADD_SPEED = 150;
export const HOLD_REMOVE_SPEED = 150;
export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const YEAR = DAY * 365;

/**
 * Should match banner file names (without extension) in lib/assets/banners/*
 */
export const BANNERS = [
	'fire-and-ice',
	'samurai',
	'dark-days',
	'bridge',
	'fire-warden',
	'gold-statues',
	'goblin-fight',
	'clan-capital-2',
	'clashiversary',
	'th-16',
	'books-of-clash',
	'chess',
	'clan-capital',
	'dark-ages-2',
	'dark-ages',
	'halloween',
	'lunar-new-year',
	'lunar-new-year-2',
	'monument',
	'space',
	'summer',
	'valentines',
	'christmas',
	'christmas-2',
	'christmas-3',
	'clashiversary-2',
	'clashiversary-3',
	'colorfest',
	'egypt',
	'goblin-gold',
	'halloween-2',
	'hammer-jam',
	'north',
	'queen-art',
	'temple',
	'th-15',
	'wild-west',
] as const;

export const ARMY_TAGS = ['CWL/War', 'Legends League', 'Farming', 'Beginner Friendly', 'Spam'] as const;
export type ArmyTag = (typeof ARMY_TAGS)[number];
/**
 * Short, URL-safe codes for `ARMY_TAGS`, so the `tags` filter query param stays clean,
 * preventing having to percent encode the spaces/slash in the full labels, which is ugly.
 */
export const ARMY_TAG_CODES: Record<ArmyTag, string> = {
	'CWL/War': 'CWL',
	'Legends League': 'Legends',
	Farming: 'Farming',
	'Beginner Friendly': 'Beginner',
	Spam: 'Spam',
};
export const ARMY_TAGS_BY_CODE = Object.fromEntries<ArmyTag>(Object.entries(ARMY_TAG_CODES).map(([tag, code]) => [code, tag as ArmyTag]));

export const USER_MAX_ARMIES = 100;
export const VALID_UNIT_HOME = ['armyCamp', 'clanCastle'] as const;
export const GUIDE_TEXT_CHAR_LIMIT = 3_000;
export const YOUTUBE_URL_REGEX =
	/^https:\/\/(?:(?:www\.|m\.)?youtube\.com\/watch\?(?=.*v=([\w-]{11}))\S*|(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]{11})(?:\?\S*)?|youtu\.be\/([\w-]{11})(?:\?\S*)?)$/;
export const MAX_COMMENT_LENGTH = 2_000;
export const MAX_ARMY_TAGS = 3;
/** Max length of the `search` army list filter */
export const MAX_FILTER_SEARCH_LENGTH = 50;
/** Max number of units that can be picked at once for the `units` army list filter (generously high) */
export const MAX_FILTER_UNITS = 50;
/**
 * Max number of equipments that can be picked at once for the `equipments` army list filter.
 * Max 4 heroes * 2 equipments each - an army can never have more, so matching more would match nothing.
 */
export const MAX_FILTER_EQUIPMENTS = 8;
/**
 * Max number of pets that can be picked at once for the `pets` army list filter.
 * Max 4 heroes * 1 pet each - an army can never have more, so matching more would match nothing.
 */
export const MAX_FILTER_PETS = 4;
/** How many armies are shown per page in a paginated army list */
export const ARMIES_PAGE_SIZE = 20;
/** Max length of the `search` army list filter */
export const MAX_FILTER_SEARCH_LENGTH = 50;
/** Max number of units that can be picked at once for the `units` army list filter (generously high) */
export const MAX_FILTER_UNITS = 50;
/**
 * Max number of equipments that can be picked at once for the `equipments` army list filter.
 * Max 4 heroes * 2 equipments each - an army can never have more, so matching more would match nothing.
 */
export const MAX_FILTER_EQUIPMENTS = 8;
/**
 * Max number of pets that can be picked at once for the `pets` army list filter.
 * Max 4 heroes * 1 pet each - an army can never have more, so matching more would match nothing.
 */
export const MAX_FILTER_PETS = 4;

// Should match metric name in `metrics` table
export const PAGE_VIEW_METRIC = 'page-view';
export const COPY_LINK_CLICK_METRIC = 'copy-link-click';
export const OPEN_LINK_CLICK_METRIC = 'open-link-click';

/**
 * Encode a unit name for clean use in the browser URL.
 * The unit here can also be a hero/equipment/pet name.
 */
export function encodeUnitName(name: string) {
	if (name === 'P.E.K.K.A') {
		// NOTE: pekka is a special case
		return 'pekka';
	}
	return name.replaceAll(' ', '-').toLowerCase();
}

export function pluralize(string: string, count: number, suffix = 's') {
	return `${string}${count !== 1 ? suffix : ''}`;
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(fn: F, ms: number) {
	let timeoutId: ReturnType<typeof setTimeout>;

	const debounced = function (this: any, ...args: Parameters<F>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn.apply(this, args);
		}, ms);
	};

	/**
	 * Drops any call that's still waiting to fire.
	 */
	debounced.cancel = function () {
		clearTimeout(timeoutId);
	};

	return debounced;
}
