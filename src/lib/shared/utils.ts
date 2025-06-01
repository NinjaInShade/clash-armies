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
 * Should match banner file names (without extension) in /static/clash/banners/*
 */
export const BANNERS = [
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
export const USER_MAX_ARMIES = 40;
export const VALID_UNIT_HOME = ['armyCamp', 'clanCastle'] as const;
export const VALID_HEROES = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Minion Prince'] as const;
export const GUIDE_TEXT_CHAR_LIMIT = 3_000;
export const YOUTUBE_URL_REGEX = /^(?:https:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
export const MAX_COMMENT_LENGTH = 2_000;
export const MAX_ARMY_TAGS = 3;

// Should match metric name in `metrics` table
export const PAGE_VIEW_METRIC = 'page-view';
export const COPY_LINK_CLICK_METRIC = 'copy-link-click';
export const OPEN_LINK_CLICK_METRIC = 'open-link-click';

// Heroes aren't stored explicitly in the database so storing here instead (for now at least)
export const HERO_CLASH_IDS = {
	'Barbarian King': 0,
	'Archer Queen': 1,
	'Grand Warden': 2,
	'Royal Champion': 4,
	'Minion Prince': 6,
};

export function pluralize(string: string, count: number, suffix = 's') {
	return `${string}${count !== 1 ? suffix : ''}`;
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(fn: F, ms: number) {
	let timeoutId: ReturnType<typeof setTimeout>;

	return function (this: any, ...args: Parameters<F>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn.apply(this, args);
		}, ms);
	};
}
