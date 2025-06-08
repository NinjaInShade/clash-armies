export const ARMY_PAGES = {
	popular: {
		bannerOptions: {
			title: 'Popular Armies',
			description: 'Browse the <b>most popular</b> armies and take your attacks to the next level',
			descriptionWidth: 315,
		},
		navOptions: {
			title: 'Popular',
			description: 'Best Armies',
			href: '/armies/popular',
		},
		img: '/clash/ui/red-book.png',
		imgAlt: 'Red book with up arrow',
	},
	latest: {
		bannerOptions: {
			title: 'Discover New',
			description: '<b>Shape the meta</b> by taking a vote on the newest armies',
			descriptionWidth: 250,
		},
		navOptions: {
			title: 'Latest',
			description: 'Newest Armies',
			href: '/armies/latest',
		},
		img: '/clash/ui/clock.png',
		imgAlt: 'Clock',
	},
	all: {
		bannerOptions: {
			title: 'All Armies',
			description: 'Find the <b>best army</b> for your play style - filter by what suits you',
			descriptionWidth: 275,
		},
		navOptions: {
			title: 'All',
			description: 'See them all!',
			href: '/armies',
		},
		img: '/clash/ui/badge-purple.png',
		imgAlt: 'Cube with question marks',
	},
	townHalls: {
		navOptions: {
			title: 'Town Hall',
			description: 'Armies by TH',
			href: '/armies/town-halls',
		},
		bannerOptions: {
			title: 'Town Halls',
			description: 'Top armies for any <b>town hall</b> to take your attacks to the next level',
			descriptionWidth: 275,
		},
		img: '/clash/town-halls/14.png',
		imgAlt: 'Town Hall 14',
	},
	townHall(level: number) {
		return {
			bannerOptions: {
				title: `Town Hall ${level}`,
				description: `Best performing <b>town hall ${level}</b> armies for any situation`,
				descriptionWidth: 265,
			},
			navOptions: {
				title: `TH${level}`,
				description: `View Armies`,
				href: `/armies/town-hall-${level}`,
			},
			img: `/clash/town-halls/${level}.png`,
			imgAlt: `Town Hall ${level}`,
		};
	},
};
