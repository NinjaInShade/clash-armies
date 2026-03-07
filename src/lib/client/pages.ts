export const ARMY_PAGES = {
	popular: {
		bannerOptions: {
			title: 'Popular Armies',
			description: 'Browse the <b>most popular</b> armies and take your attacks to the next level!',
			descriptionWidth: 315,
			img: '/ui/red-book.webp',
			imgAlt: 'Red book with up arrow',
		},
		navOptions: {
			title: 'Popular',
			description: 'Best Armies',
			href: '/armies/popular',
			img: '/ui/red-book.webp',
			imgAlt: 'Red book with up arrow',
		},
	},
	rising: {
		bannerOptions: {
			title: 'Rising Armies',
			description: '<b>Vote on new armies</b> and help shape the attacking meta!',
			descriptionWidth: 275,
			img: '/ui/badge-purple.webp',
			imgAlt: 'Purple badge with sword across it, at a skewed angle',
		},
		navOptions: {
			title: 'Rising',
			description: 'Latest armies',
			img: '/ui/badge-purple.webp',
			imgAlt: 'Purple badge with sword across it, at a skewed angle',
			href: '/armies',
		},
	},
	browse: {
		bannerOptions: {
			title: 'Browse Armies',
			description: 'Browse the best armies by <b>hero, equipment, pet, troop</b> and more',
			descriptionWidth: 315,
			img: '/units/Golem.webp',
			imgAlt: 'Troop: Golem',
		},
		navOptions: {
			title: 'Browse',
			description: 'Find by unit',
			img: '/units/Golem.webp',
			imgAlt: 'Troop: Golem',
			href: '/armies/browse',
		},
	},
	townHalls: {
		navOptions: {
			title: 'Town Hall',
			description: 'Armies by TH',
			img: '/town-halls/14.webp',
			imgAlt: 'Town Hall 14',
			href: '/armies/town-halls',
		},
		bannerOptions: {
			title: 'Town Halls',
			description: 'Best armies for any <b>town hall</b> to dominate your attacks',
			descriptionWidth: 275,
			img: '/town-halls/14_large.webp',
			imgAlt: 'Town Hall 14',
		},
	},
	townHall(level: number) {
		return {
			bannerOptions: {
				title: `Town Hall ${level}`,
				description: `Best <b>town hall ${level}</b> armies dominate your attacks`,
				descriptionWidth: 265,
				img: `/town-halls/${level}_large.webp`,
				imgAlt: `Town Hall ${level}`,
			},
			navOptions: {
				title: `TH${level}`,
				description: `View Armies`,
				img: `/town-halls/${level}.webp`,
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
				img: `/heroes/${hero} Full Height.webp`,
				imgAlt: hero,
			},
			navOptions: {
				title: hero,
				description: `View Armies`,
				img: `/heroes/${hero}.webp`,
				imgAlt: hero,
				href: `/armies/heroes/${hero}`,
			},
		};
	},
	equipment(equipment: string) {
		return {
			bannerOptions: {
				title: equipment,
				description: `Best <b>${equipment}</b> armies to dominate your attacks`,
				descriptionWidth: 250,
				img: `/heroes/equipment/${equipment}.webp`,
				imgAlt: `Equipment: ${equipment}`,
			},
			navOptions: {
				title: equipment,
				description: `View Armies`,
				img: `/heroes/equipment/${equipment}_small.webp`,
				imgAlt: `Equipment: ${equipment}`,
				href: `/armies/equipment/${equipment}`,
			},
		};
	},
	pet(pet: string) {
		return {
			bannerOptions: {
				title: pet,
				description: `Best <b>${pet}</b> armies to dominate your attacks`,
				descriptionWidth: 250,
				img: `/heroes/pets/${pet}.webp`,
				imgAlt: `Pet: ${pet}`,
			},
			navOptions: {
				title: pet,
				description: `View Armies`,
				img: `/heroes/pets/${pet}.webp`,
				imgAlt: `Pet: ${pet}`,
				href: `/armies/pets/${pet}`,
			},
		};
	},
	troop(troop: string) {
		return {
			bannerOptions: {
				title: troop,
				description: `Best <b>${troop}</b> armies to dominate your attacks`,
				descriptionWidth: 275,
				img: `/units/${troop}.webp`,
				imgAlt: `Troop: ${troop}`,
			},
			navOptions: {
				title: troop,
				description: `View Armies`,
				img: `/units/${troop}_small.webp`,
				imgAlt: `Troop: ${troop}`,
				href: `/armies/troops/${troop}`,
			},
		};
	},
	spell(spell: string) {
		return {
			bannerOptions: {
				title: spell,
				description: `Best <b>${spell}</b> armies to dominate your attacks`,
				descriptionWidth: 235,
				img: `/units/${spell}.webp`,
				imgAlt: `Spell: ${spell}`,
			},
			navOptions: {
				title: spell,
				description: `View Armies`,
				img: `/units/${spell}_small.webp`,
				imgAlt: `Spell: ${spell}`,
				href: `/armies/spells/${spell}`,
			},
		};
	},
	siege(siege: string) {
		// Stone Slammer has extra horizontal whitespace (due to being
		// taller than wider), use trimmed/thin variant for banner.
		const bannerImg = siege === 'Stone Slammer' ? `/units/${siege}_thin.webp` : `/units/${siege}.webp`;
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
				img: `/units/${siege}_small.webp`,
				imgAlt: `Siege Machine: ${siege}`,
				href: `/armies/sieges/${siege}`,
			},
		};
	},
};
