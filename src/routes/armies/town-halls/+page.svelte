<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { ARMY_PAGES } from '$client/pages';
	import Banner from '~/components/Armies/Banner.svelte';

	const app = getContext<AppState>('app');
	const pageMeta = ARMY_PAGES.townHalls;
</script>

<svelte:head>
	<title>ClashArmies • Best Clash of Clans Armies for every Town Hall</title>
	<meta name="description" content="Browse Clash of Clans armies by Town Hall. Select a Town Hall level to view powerful attack strategies." />
	<link rel="canonical" href="https://clasharmies.com/town-halls" />
</svelte:head>

<section class="town-halls">
	<div class="container">
		<Banner {...pageMeta.bannerOptions} img={pageMeta.img} imgAlt={pageMeta.imgAlt} />
		<ul class="links">
			{#each [...app.townHalls].reverse() as th}
				{@const { navOptions, img, imgAlt } = ARMY_PAGES.townHall(th.level)}
				<li>
					<a class="th-link-card" href={navOptions.href}>
						<div class="img-container">
							<img src={img} alt={imgAlt} />
						</div>
						<div>
							<b class="title">
								{navOptions.title}
								<svg class="arrow" viewBox="0 0 10 9" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 4.5H9M9 4.5L5.8 1.5M9 4.5L5.8 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</b>
							<p class="description">{navOptions.description}</p>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.town-halls {
		padding: 24px var(--side-padding) 32px var(--side-padding);
		flex: 1 0 0px;
	}

	.links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
		margin-top: 10px;
		gap: 10px;

		& .th-link-card {
			display: flex;
			align-items: center;
			border-radius: 6px;
			background-color: var(--grey-850);
			gap: 10px;
			padding: 12px;

			& .img-container {
				display: flex;
				justify-content: center;
				align-items: center;
				min-width: 45px;
				min-height: 45px;
				width: 45px;
				height: 45px;

				& img {
					height: 100%;
					width: auto;
				}
			}

			& .title,
			& .description {
				font-size: var(--fs);
				line-height: var(--fs-lh);
			}

			& .title {
				display: flex;
				align-items: center;
				color: var(--grey-100);
				font-weight: 600;
				gap: 4px;

				& .arrow {
					height: 10px;
					width: auto;

					display: inline-block;
					transform: scale(0.6);
					opacity: 0;
					transition:
						transform 0.1s ease,
						opacity 0.1s ease;
					transform-origin: center;
				}
			}

			& .description {
				white-space: nowrap;
				transition: 0.1s color ease;
				color: var(--grey-400);
			}

			&:hover {
				& .title {
					.arrow {
						transform: scale(1);
						opacity: 1;
					}
				}

				& .description {
					color: var(--grey-100);
				}
			}
		}
	}
</style>
