<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import LinkCard from './LinkCard.svelte';
	import { ARMY_PAGES } from '$client/pages';

	type Props = {
		open: boolean;
	};
	let { open = $bindable() }: Props = $props();

	const app = getContext<AppState>('app');

	const generalLinks = $derived([
		{
			title: 'Home',
			description: 'Home page',
			img: '/clash/ui/signpost.webp',
			imgAlt: 'Wooden signpost',
			href: '/',
		},
		{
			title: 'Army Builder',
			description: 'Share your army!',
			img: '/clash/ui/hammer-and-saw.webp',
			imgAlt: 'Hammer and saw crossed over each other',
			href: '/army-builder',
		},
	]);
	const armyLinks = [ARMY_PAGES.popular, ARMY_PAGES.latest, ARMY_PAGES.townHalls, ARMY_PAGES.all];
	// prettier-ignore
	const accountLinks = $derived([
		...(app.user ? [
				{
					title: 'Profile',
					description: 'View Profile',
					img: '/clash/ui/clash-profile.webp',
					imgAlt: 'Profile',
					href: `/users/${app.user?.username}`,
				}]
		: []),
		...(app.user && app.user.hasRoles('admin') ? [
			{
				title: 'Admin',
				description: 'Admin Panel',
				img: '/clash/ui/admin.webp',
				imgAlt: 'Admin badge',
				href: '/admin',
			}]
		: []),
		...(app.user ? [
			{
				title: 'Log out',
				description: 'End your session',
				img: authIcon,
				href: '/api/logout',
			}]
		: [{
				title: 'Log in',
				description: 'Start sharing armies!',
				img: authIcon,
				href: '/api/login/google',
			}]
		),
	]);

	function onLinkClicked() {
		open = false;
		document.body.classList.remove('mobile-nav-open');
	}
</script>

<div class="armies-menu" style="--grid-col-width: 150px">
	<section>
		<h3>General</h3>
		<ul class="links" style="--grid-cols: 2">
			{#each generalLinks as link}
				<li>
					<LinkCard {...link} onClicked={onLinkClicked} />
				</li>
			{/each}
		</ul>
	</section>
	<section>
		<h3>Armies</h3>
		<ul class="links" style="--grid-cols: 2">
			{#each armyLinks as link}
				<li>
					<LinkCard {...link.navOptions} onClicked={onLinkClicked} />
				</li>
			{/each}
		</ul>
	</section>
	<section>
		<h3>Account</h3>
		<ul class="links">
			{#each accountLinks as link}
				<li>
					<LinkCard {...link} onClicked={onLinkClicked} />
				</li>
			{/each}
		</ul>
	</section>
</div>

{#snippet authIcon()}
	<svg style="height: 24px; width: auto;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
		<path
			d="M1.81818 16C1.31818 16 0.890303 15.8261 0.534545 15.4782C0.178788 15.1304 0.000606061 14.7117 0 14.2222V1.77778C0 1.28889 0.178182 0.870518 0.534545 0.522666C0.890909 0.174815 1.31879 0.000592592 1.81818 0H7.27273C7.5303 0 7.74636 0.0853334 7.92091 0.256C8.09545 0.426666 8.18242 0.637629 8.18182 0.888888C8.18121 1.14015 8.09394 1.35141 7.92 1.52267C7.74606 1.69392 7.5303 1.77896 7.27273 1.77778H1.81818V14.2222H7.27273C7.5303 14.2222 7.74636 14.3075 7.92091 14.4782C8.09545 14.6489 8.18242 14.8598 8.18182 15.1111C8.18121 15.3624 8.09394 15.5736 7.92 15.7449C7.74606 15.9161 7.5303 16.0012 7.27273 16H1.81818ZM12.8864 8.88888H6.36364C6.10606 8.88888 5.8903 8.80355 5.71636 8.63288C5.54242 8.46222 5.45515 8.25125 5.45455 7.99999C5.45394 7.74874 5.54121 7.53777 5.71636 7.36711C5.89152 7.19644 6.10727 7.11111 6.36364 7.11111H12.8864L11.1818 5.44444C11.0152 5.28148 10.9318 5.08148 10.9318 4.84444C10.9318 4.6074 11.0152 4.4 11.1818 4.22222C11.3485 4.04444 11.5606 3.9517 11.8182 3.944C12.0758 3.93629 12.2955 4.02163 12.4773 4.2L15.7273 7.37777C15.9091 7.55555 16 7.76296 16 7.99999C16 8.23703 15.9091 8.44444 15.7273 8.62222L12.4773 11.8C12.2955 11.9778 12.0797 12.0631 11.83 12.056C11.5803 12.0489 11.3642 11.9561 11.1818 11.7778C11.0152 11.6 10.9358 11.389 10.9436 11.1449C10.9515 10.9007 11.0385 10.6969 11.2045 10.5333L12.8864 8.88888Z"
			fill="var(--grey-100)"
		/>
	</svg>
{/snippet}

<style>
	.armies-menu {
		display: flex;
		flex-flow: column nowrap;
		background-color: var(--grey-850);
		padding: 24px var(--side-padding);
		border-top: 1px solid var(--grey-550);
		border-radius: 0 0 8px 8px;
		width: 100%;
		gap: 32px;

		& section {
			& h3 {
				text-align: left;
				font-family: 'Poppins', sans-serif;
				font-size: var(--fs);
				line-height: var(--fs);
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 1px;
				border-bottom: 1px solid var(--grey-550);
				padding-bottom: 10px;
				margin-bottom: 14px;
			}

			& .links {
				display: grid;
				grid-template-columns: repeat(var(--grid-cols, 1), var(--grid-col-width));
				column-gap: 20px;
				row-gap: 12px;

				@media (max-width: 370px) {
					grid-template-columns: 1fr;
				}
			}
		}
	}
</style>
