import { encodeUnitName } from '$shared/utils';
import { thImgURL, unitImgURL, heroImgURL, equipmentImgURL, petImgURL } from '$client/assets';
import ImgGem from '$assets/ui/gem.webp';
import ImgLeafBadge from '$assets/ui/leaf-badge.webp';

export const ARMY_PAGES = {
	popular: {
		bannerOptions: {
			title: 'Popular Armies',
			description: 'Browse the <b>most popular</b> armies and take your attacks to the next level!',
			descriptionWidth: 315,
			img: ImgGem,
			imgAlt: 'Clash of clans gem',
		},
		navOptions: {
			title: 'Popular',
			description: 'Best Armies',
			href: '/armies/popular',
			img: ImgGem,
			imgAlt: 'Clash of clans gem',
		},
	},
	latest: {
		bannerOptions: {
			title: 'New Armies',
			description: '<b>Vote on new armies</b> and help shape the attacking meta!',
			descriptionWidth: 275,
			img: ImgLeafBadge,
			imgAlt: 'Badge with leaf emblem',
		},
		navOptions: {
			title: 'New',
			description: 'Latest Armies',
			img: ImgLeafBadge,
			imgAlt: 'Badge with leaf emblem',
			href: '/armies',
		},
	},
	browse: {
		bannerOptions: {
			title: 'Browse Armies',
			description: 'Browse the best armies by <b>hero, equipment, pet, troop</b> and more',
			descriptionWidth: 315,
			img: unitImgURL('Golem'),
			imgAlt: 'Troop: Golem',
		},
		navOptions: {
			title: 'Browse',
			description: 'Armies by unit',
			img: unitImgURL('Golem'),
			imgAlt: 'Troop: Golem',
			href: '/armies/browse',
		},
	},
	townHalls: {
		navOptions: {
			title: 'Town Hall',
			description: 'Armies by TH',
			img: thImgURL(14),
			imgAlt: 'Town Hall 14',
			href: '/armies/town-halls',
		},
		bannerOptions: {
			title: 'Town Halls',
			description: 'Best armies for any <b>town hall</b> to dominate your attacks',
			descriptionWidth: 275,
			img: thImgURL(14, 'large'),
			imgAlt: 'Town Hall 14',
		},
	},
	townHall(level: number) {
		return {
			bannerOptions: {
				title: `Town Hall ${level}`,
				description: `Best <b>town hall ${level}</b> armies dominate your attacks`,
				descriptionWidth: 265,
				img: thImgURL(level, 'large'),
				imgAlt: `Town Hall ${level}`,
			},
			navOptions: {
				title: `TH${level}`,
				description: `View Armies`,
				img: thImgURL(level),
				imgAlt: `Town Hall ${level}`,
				href: `/armies/town-hall-${level}`,
			},
		};
	},
	hero(hero: string) {
		return {
			bannerOptions: {
				title: hero,
				description: `Best <b>${hero}</b> armies to dominate your attacks`,
				descriptionWidth: 250,
				img: heroImgURL(hero, 'full-height'),
				imgAlt: hero,
			},
			navOptions: {
				title: hero,
				description: `View Armies`,
				img: heroImgURL(hero),
				imgAlt: hero,
				href: `/armies/heroes/${encodeUnitName(hero)}`,
			},
		};
	},
	equipment(equipment: string) {
		return {
			bannerOptions: {
				title: equipment,
				description: `Best <b>${equipment}</b> armies to dominate your attacks`,
				descriptionWidth: 250,
				img: equipmentImgURL(equipment),
				imgAlt: `Equipment: ${equipment}`,
			},
			navOptions: {
				title: equipment,
				description: `View Armies`,
				img: equipmentImgURL(equipment, 'small'),
				imgAlt: `Equipment: ${equipment}`,
				href: `/armies/equipment/${encodeUnitName(equipment)}`,
			},
		};
	},
	pet(pet: string) {
		return {
			bannerOptions: {
				title: pet,
				description: `Best <b>${pet}</b> armies to dominate your attacks`,
				descriptionWidth: 250,
				img: petImgURL(pet),
				imgAlt: `Pet: ${pet}`,
			},
			navOptions: {
				title: pet,
				description: `View Armies`,
				img: petImgURL(pet),
				imgAlt: `Pet: ${pet}`,
				href: `/armies/pets/${encodeUnitName(pet)}`,
			},
		};
	},
	troop(troop: string) {
		return {
			bannerOptions: {
				title: troop,
				description: `Best <b>${troop}</b> armies to dominate your attacks`,
				descriptionWidth: 275,
				img: unitImgURL(troop),
				imgAlt: `Troop: ${troop}`,
			},
			navOptions: {
				title: troop,
				description: `View Armies`,
				img: unitImgURL(troop, 'small'),
				imgAlt: `Troop: ${troop}`,
				href: `/armies/troops/${encodeUnitName(troop)}`,
			},
		};
	},
	spell(spell: string) {
		return {
			bannerOptions: {
				title: spell,
				description: `Best <b>${spell}</b> armies to dominate your attacks`,
				descriptionWidth: 235,
				img: unitImgURL(spell),
				imgAlt: `Spell: ${spell}`,
			},
			navOptions: {
				title: spell,
				description: `View Armies`,
				img: unitImgURL(spell, 'small'),
				imgAlt: `Spell: ${spell}`,
				href: `/armies/spells/${encodeUnitName(spell)}`,
			},
		};
	},
	siege(siege: string) {
		// Stone Slammer has extra horizontal whitespace (due to being
		// taller than wider), use trimmed/thin variant for banner.
		const bannerImg = siege === 'Stone Slammer' ? unitImgURL(siege, 'thin') : unitImgURL(siege);
		return {
			bannerOptions: {
				title: siege,
				description: `Best <b>${siege}</b> armies to dominate your attacks`,
				descriptionWidth: 265,
				img: bannerImg,
				imgAlt: `Siege Machine: ${siege}`,
			},
			navOptions: {
				title: siege,
				description: `View Armies`,
				img: unitImgURL(siege, 'small'),
				imgAlt: `Siege Machine: ${siege}`,
				href: `/armies/sieges/${encodeUnitName(siege)}`,
			},
		};
	},
};
