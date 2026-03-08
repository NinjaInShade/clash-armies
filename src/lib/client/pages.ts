export const ARMY_PAGES = {
	popular: {
		bannerOptions: {
			title: 'Popular Armies',
			description: 'Browse the <b>most popular</b> armies and take your attacks to the next level!',
			descriptionWidth: 315,
			img: '/ui/gem.webp',
			imgAlt: 'Clash of clans gem',
		},
		navOptions: {
			title: 'Popular',
			description: 'Best Armies',
			href: '/armies/popular',
			img: '/ui/gem.webp',
			imgAlt: 'Clash of clans gem',
		},
	},
	rising: {
		bannerOptions: {
			title: 'Rising Armies',
			description: '<b>Vote on new armies</b> and help shape the attacking meta!',
			descriptionWidth: 275,
			img: '/ui/leaf-badge.webp',
			imgAlt: 'Badge with leaf emblem',
		},
		navOptions: {
			title: 'Rising',
			description: 'Latest Armies',
			img: '/ui/leaf-badge.webp',
			imgAlt: 'Badge with leaf emblem',
			href: '/armies',
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
			description: 'Top armies for any <b>town hall</b> to take your attacks to the next level',
			descriptionWidth: 275,
			img: '/town-halls/14_large.webp',
			imgAlt: 'Town Hall 14',
		},
	},
	townHall(level: number) {
		return {
			bannerOptions: {
				title: `Town Hall ${level}`,
				description: `Best performing <b>town hall ${level}</b> armies for any situation`,
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
};
