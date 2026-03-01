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
