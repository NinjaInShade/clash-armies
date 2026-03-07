<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { ARMY_PAGES } from '$client/pages';
	import { VALID_HEROES } from '$shared/utils';
	import Banner from '~/components/Armies/Banner.svelte';

	const app = getContext<AppState>('app');
	const pageMeta = ARMY_PAGES.browse;

	const troops = $derived(app.units.filter((u) => u.type === 'Troop'));
	const spells = $derived(app.units.filter((u) => u.type === 'Spell'));
	const sieges = $derived(app.units.filter((u) => u.type === 'Siege'));

	// TODO: /troops/UNKNOWN validation
</script>

<svelte:head>
	<title>ClashArmies • Browse Clash of Clans Armies by unit</title>
	<meta name="description" content="Browse the best Clash of Clans armies by Hero, Equipment, Pet, Troop, Spell and Siege machine." />
	<link rel="canonical" href="https://clasharmies.com/armies/browse" />
</svelte:head>

<section class="browse">
	<div class="container">
		<Banner {...pageMeta.bannerOptions} />

		<div class="sections">
			<section>
				<h3>Heroes</h3>
				<ul class="links">
					{#each VALID_HEROES as hero}
						{@render linkCard(ARMY_PAGES.hero(hero).navOptions)}
					{/each}
				</ul>
			</section>

			<section>
				<h3>Troops</h3>
				<ul class="links">
					{#each troops as troop}
						{@render linkCard(ARMY_PAGES.troop(troop.name).navOptions)}
					{/each}
				</ul>
			</section>

			<section>
				<h3>Spells</h3>
				<ul class="links">
					{#each spells as spell}
						{@render linkCard(ARMY_PAGES.spell(spell.name).navOptions)}
					{/each}
				</ul>
			</section>

			<section>
				<h3>Siege Machines</h3>
				<ul class="links">
					{#each sieges as siege}
						{@render linkCard(ARMY_PAGES.siege(siege.name).navOptions)}
					{/each}
				</ul>
			</section>

			<section>
				<h3>Equipment</h3>
				<ul class="links">
					{#each app.equipment as eq}
						{@render linkCard(ARMY_PAGES.equipment(eq.name).navOptions)}
					{/each}
				</ul>
			</section>

			<section>
				<h3>Pets</h3>
				<ul class="links">
					{#each app.pets as pet}
						{@render linkCard(ARMY_PAGES.pet(pet.name).navOptions)}
					{/each}
				</ul>
			</section>
		</div>
	</div>
</section>

{#snippet linkCard(navOptions: { title: string; description: string; img: string; imgAlt: string; href: string })}
	<li>
		<a class="link-card" href={navOptions.href}>
			<div class="img-container">
				<img src={navOptions.img} alt={navOptions.imgAlt} />
			</div>
			<div>
				<b class="title">
					<span class="title-text">{navOptions.title}</span>
					<svg class="arrow" viewBox="0 0 10 9" xmlns="http://www.w3.org/2000/svg">
						<path d="M1 4.5H9M9 4.5L5.8 1.5M9 4.5L5.8 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</b>
				<p class="description">{navOptions.description}</p>
			</div>
		</a>
	</li>
{/snippet}

<style>
	.browse {
		padding: 24px var(--side-padding) 32px var(--side-padding);
		flex: 1 0 0px;
	}

	.sections {
		display: flex;
		flex-flow: column nowrap;
		gap: 28px;
		margin-top: 24px;

		& section {
			& h3 {
				text-align: left;
				font-family: 'Poppins', sans-serif;
				font-size: var(--fs);
				line-height: var(--fs);
				font-weight: 600;
				border-bottom: 1px solid var(--grey-550);
				text-transform: uppercase;
				letter-spacing: 1px;
				padding-bottom: 10px;
				margin-bottom: 12px;
			}
		}
	}

	.links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 10px;

		& .link-card {
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

				& .title-text {
					max-width: 18ch;
					text-overflow: ellipsis;
					overflow: hidden;
					white-space: nowrap;
				}

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
