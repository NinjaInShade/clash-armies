<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import Logo from './Logo.svelte';
	import NotificationsMenu from './NotificationsMenu.svelte';
	import Menu from './Menu.svelte';
	import BMCButton from './BMCButton.svelte';
	import Button from './Button.svelte';

	const app = getContext<AppState>('app');

	const hasUnseenNotifications = $derived(app.user ? app.user.notifications.filter((notif) => !notif.seen).length > 0 : false);

	let sidebarOpen = $state<boolean>(false);

	let notificationsBtn = $state<HTMLButtonElement>();
	let notificationsOpen = $state<boolean>(false);

	let accountBtn = $state<HTMLButtonElement>();
	let accountMenuOpen = $state<boolean>(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		document.body.classList.toggle('sidebar-active');
	}

	function closeSidebar() {
		sidebarOpen = false;
		document.body.classList.remove('sidebar-active');
	}

	function toggleNotifications() {
		notificationsOpen = !notificationsOpen;
	}

	function toggleAccountMenu() {
		accountMenuOpen = !accountMenuOpen;
	}
</script>

<nav>
	<div class="container">
		<div class="left">
			<Logo />
			<ul class="links desktop">
				<li>
					{@render armiesLink()}
				</li>
				<li>
					{@render armyBuilderLink()}
				</li>
				<li>
					{@render adminLink()}
				</li>
			</ul>
		</div>
		<ul class="links">
			<li>
				{@render notificationsButton()}
			</li>
			<li class="desktop">
				{@render accountButton()}
			</li>
			{#if !app.user}
				<li class="desktop">
					<Button asLink href="/login">Log in</Button>
				</li>
			{/if}
			<li class="mobile">
				<button class="navbar-hamburger focus-grey" type="button" aria-label="Sidebar toggle" onclick={toggleSidebar}>
					<svg class="hamburger-svg" class:active={sidebarOpen} viewBox="0 0 100 100" width="45">
						<path class="line top" d="m 70,33 h -40 c 0,0 -8.5,-0.149796 -8.5,8.5 0,8.649796 8.5,8.5 8.5,8.5 h 20 v -20" />
						<path class="line middle" d="m 70,50 h -40" />
						<path class="line bottom" d="m 30,67 h 40 c 0,0 8.5,0.149796 8.5,-8.5 0,-8.649796 -8.5,-8.5 -8.5,-8.5 h -20 v 20" />
					</svg>
				</button>
			</li>
		</ul>
	</div>
</nav>

<nav class="sidebar" class:active={sidebarOpen} tabIndex={sidebarOpen ? undefined : -1}>
	<div>
		<section class="sidebar-section">
			<h3>General</h3>
			<ul class="sidebar-links">
				<li>
					{@render homeLink(true)}
				</li>
			</ul>
		</section>
		<section class="sidebar-section">
			<h3>Armies</h3>
			<ul class="sidebar-links">
				<li>
					{@render armiesLink(true)}
				</li>
				<li>
					{@render armyBuilderLink(true)}
				</li>
			</ul>
		</section>
		<section class="sidebar-section">
			<h3>Account</h3>
			<ul class="sidebar-links">
				<li>
					{@render accountLink(true)}
				</li>
				<li>
					{@render adminLink(true)}
				</li>
				<li>
					{@render logoutLink(true)}
				</li>
				<li>
					{@render loginLink(true)}
				</li>
			</ul>
		</section>
	</div>
	<ul class="sidebar-buttons">
		<li>
			<BMCButton />
		</li>
	</ul>
</nav>
<button class="sidebar-overlay" class:active={sidebarOpen} onclick={toggleSidebar} tabIndex={sidebarOpen ? undefined : -1} aria-label="Close sidebar"></button>

<NotificationsMenu bind:open={notificationsOpen} elRef={notificationsBtn} />

<Menu bind:open={accountMenuOpen} elRef={accountBtn} placementOffset={12} --menu-width="175px">
	<div class="ca-menu">
		<ul class="ca-menu-list">
			<li>
				{@render accountLink(true)}
			</li>
			<li>
				{@render logoutLink(true)}
			</li>
		</ul>
	</div>
</Menu>

{#snippet armiesLink(mobile = false)}
	<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/armies" onclick={closeSidebar}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M15.0886 3.42858e-08C15.3303 3.42858e-08 15.5621 0.0960204 15.7331 0.266937C15.904 0.437854 16 0.669667 16 0.91138V6.06706C16 6.20955 15.9667 6.35006 15.9026 6.47732C15.8385 6.60457 15.7454 6.71503 15.6309 6.79981L9.07078 11.6484L9.93294 12.5114C10.1038 12.6823 10.1998 12.9141 10.1998 13.1558C10.1998 13.3974 10.1038 13.6292 9.93294 13.8001L8.64425 15.0888C8.50898 15.224 8.33463 15.3131 8.14588 15.3437C7.95713 15.3743 7.76354 15.3448 7.59251 15.2592L5.60206 14.2649L4.13292 15.7332C3.96201 15.904 3.73023 16 3.48857 16C3.2469 16 3.01513 15.904 2.84422 15.7332L0.26684 13.1558C0.0959825 12.9849 0 12.7531 0 12.5114C0 12.2698 0.0959825 12.038 0.26684 11.8671L1.73507 10.3979L0.740758 8.40748C0.655245 8.23646 0.62569 8.04287 0.656276 7.85412C0.686862 7.66537 0.77604 7.49102 0.911186 7.35575L2.19988 6.06706C2.37079 5.8962 2.60256 5.80022 2.84422 5.80022C3.08589 5.80022 3.31766 5.8962 3.48857 6.06706L4.35165 6.92922L9.20019 0.369109C9.28497 0.254587 9.39543 0.161538 9.52268 0.0974355C9.64994 0.0333326 9.79045 -3.90467e-05 9.93294 3.42858e-08H15.0886Z"
				fill="currentColor"
			/>
		</svg>
		Armies
	</a>
{/snippet}

{#snippet armyBuilderLink(mobile = false)}
	{#if app.user}
		<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/create" onclick={closeSidebar}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
				<path
					d="M4.2261 3.99116C4.00805 4.07567 3.89338 4.15679 3.8595 4.18975L2.63114 2.99485L5.00881 0.681946C5.97568 -0.258596 7.66098 -0.245075 8.77641 0.83997L9.78325 1.81938C9.9477 1.66954 10.1656 1.58772 10.3909 1.59119C10.6162 1.59466 10.8313 1.68315 10.9908 1.83798L14.5568 5.30691C14.7161 5.46195 14.8072 5.67113 14.811 5.89029C14.8147 6.10945 14.7307 6.32145 14.5768 6.48153L15.7452 7.61897C15.826 7.69745 15.8901 7.79065 15.9338 7.89324C15.9775 7.99582 16 8.10579 16 8.21684C16 8.32789 15.9775 8.43786 15.9338 8.54044C15.8901 8.64303 15.826 8.73623 15.7452 8.81471L13.9626 10.5488C13.7997 10.7072 13.5788 10.7962 13.3484 10.7962C13.1181 10.7962 12.8972 10.7072 12.7343 10.5488L11.565 9.41132C11.4104 9.55211 11.2084 9.63316 10.9967 9.63923C10.7851 9.6453 10.5785 9.57597 10.4157 9.44428L6.73668 5.86718C6.60117 5.70866 6.52991 5.50742 6.53631 5.30135C6.54271 5.09529 6.62633 4.8986 6.77142 4.74833L6.03389 4.03173C5.87752 3.87962 5.50745 3.75962 4.94105 3.82046C4.69588 3.84717 4.45616 3.90454 4.2261 3.99116ZM5.54567 7.09673L0.254347 12.2448C0.0914889 12.4032 0 12.6181 0 12.8422C0 13.0663 0.0914889 13.2812 0.254347 13.4397L2.63114 15.7526C2.79405 15.911 3.01497 16 3.24532 16C3.47567 16 3.69659 15.911 3.8595 15.7526L9.15083 10.6054L5.54567 7.09842V7.09673Z"
					fill="currentColor"
				/>
			</svg>
			Army Builder
		</a>
	{/if}
{/snippet}

{#snippet adminLink(mobile = false)}
	{#if app.user && app.user.hasRoles('admin')}
		<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/admin" onclick={closeSidebar}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 16">
				<path
					d="M6.5 8H11.5556C11.1728 10.9891 9.18667 13.6582 6.5 14.4873V8ZM6.5 8H1.44444V3.85455L6.5 1.59273M6.5 0L0 2.90909V7.27273C0 11.3091 2.77333 15.0764 6.5 16C10.2267 15.0764 13 11.3091 13 7.27273V2.90909L6.5 0Z"
					fill="currentColor"
				/>
			</svg>
			Admin
		</a>
	{/if}
{/snippet}

{#snippet accountLink(mobile = false)}
	{#if app.user}
		<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/users/{app.user.username}" aria-label="Account" onclick={closeSidebar}>
			{@render accountIcon(mobile)}
			Profile
		</a>
	{/if}
{/snippet}

{#snippet logoutLink(mobile = false)}
	{#if app.user}
		<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/api/logout" onclick={closeSidebar}>
			{@render authIcon()}
			Log out
		</a>
	{/if}
{/snippet}

{#snippet loginLink(mobile = false)}
	{#if !app.user}
		<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/login" onclick={closeSidebar}>
			{@render authIcon()}
			Log in
		</a>
	{/if}
{/snippet}

{#snippet homeLink(mobile = false)}
	<a class="body focus-grey link link-{mobile ? 'mobile' : 'desktop'}" href="/" onclick={closeSidebar}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M7.3707 0.260258C7.53762 0.0936147 7.76398 0 8 0C8.23602 0 8.46238 0.0936147 8.6293 0.260258L13.9699 5.59365L15.7501 7.37145C15.9123 7.5391 16.002 7.76364 16 7.99671C15.9979 8.22977 15.9043 8.45272 15.7393 8.61753C15.5743 8.78234 15.351 8.87582 15.1176 8.87785C14.8842 8.87987 14.6594 8.79028 14.4915 8.62836L14.2307 8.36791V14.2222C14.2307 14.6937 14.0432 15.1459 13.7093 15.4793C13.3755 15.8127 12.9227 16 12.4505 16H9.78021C9.54414 16 9.31774 15.9063 9.15081 15.7396C8.98388 15.5729 8.8901 15.3469 8.8901 15.1111V12.4444H7.1099V15.1111C7.1099 15.3469 7.01612 15.5729 6.84919 15.7396C6.68226 15.9063 6.45586 16 6.21979 16H3.54948C3.07734 16 2.62454 15.8127 2.29068 15.4793C1.95683 15.1459 1.76927 14.6937 1.76927 14.2222V8.36791L1.50847 8.62836C1.34059 8.79028 1.11575 8.87987 0.88237 8.87785C0.648987 8.87582 0.425738 8.78234 0.260706 8.61753C0.095673 8.45272 0.00206168 8.22977 3.36483e-05 7.99671C-0.00199438 7.76364 0.0877231 7.5391 0.249863 7.37145L2.03007 5.59365L7.3707 0.260258Z"
				fill="currentColor"
			/>
		</svg>
		Home
	</a>
{/snippet}

{#snippet accountIcon(mobile = false)}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="account-{mobile ? 'mobile' : 'desktop'}">
		<path
			d="M12 0C5.376 0 0 5.376 0 12C0 18.624 5.376 24 12 24C18.624 24 24 18.624 24 12C24 5.376 18.624 0 12 0ZM12 4.8C14.316 4.8 16.2 6.684 16.2 9C16.2 11.316 14.316 13.2 12 13.2C9.684 13.2 7.8 11.316 7.8 9C7.8 6.684 9.684 4.8 12 4.8ZM12 21.6C9.564 21.6 6.684 20.616 4.632 18.144C6.73419 16.4955 9.32851 15.5995 12 15.5995C14.6715 15.5995 17.2658 16.4955 19.368 18.144C17.316 20.616 14.436 21.6 12 21.6Z"
			fill="currentColor"
		/>
	</svg>
{/snippet}

{#snippet authIcon()}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
		<path
			d="M1.81818 16C1.31818 16 0.890303 15.8261 0.534545 15.4782C0.178788 15.1304 0.000606061 14.7117 0 14.2222V1.77778C0 1.28889 0.178182 0.870518 0.534545 0.522666C0.890909 0.174815 1.31879 0.000592592 1.81818 0H7.27273C7.5303 0 7.74636 0.0853334 7.92091 0.256C8.09545 0.426666 8.18242 0.637629 8.18182 0.888888C8.18121 1.14015 8.09394 1.35141 7.92 1.52267C7.74606 1.69392 7.5303 1.77896 7.27273 1.77778H1.81818V14.2222H7.27273C7.5303 14.2222 7.74636 14.3075 7.92091 14.4782C8.09545 14.6489 8.18242 14.8598 8.18182 15.1111C8.18121 15.3624 8.09394 15.5736 7.92 15.7449C7.74606 15.9161 7.5303 16.0012 7.27273 16H1.81818ZM12.8864 8.88888H6.36364C6.10606 8.88888 5.8903 8.80355 5.71636 8.63288C5.54242 8.46222 5.45515 8.25125 5.45455 7.99999C5.45394 7.74874 5.54121 7.53777 5.71636 7.36711C5.89152 7.19644 6.10727 7.11111 6.36364 7.11111H12.8864L11.1818 5.44444C11.0152 5.28148 10.9318 5.08148 10.9318 4.84444C10.9318 4.6074 11.0152 4.4 11.1818 4.22222C11.3485 4.04444 11.5606 3.9517 11.8182 3.944C12.0758 3.93629 12.2955 4.02163 12.4773 4.2L15.7273 7.37777C15.9091 7.55555 16 7.76296 16 7.99999C16 8.23703 15.9091 8.44444 15.7273 8.62222L12.4773 11.8C12.2955 11.9778 12.0797 12.0631 11.83 12.056C11.5803 12.0489 11.3642 11.9561 11.1818 11.7778C11.0152 11.6 10.9358 11.389 10.9436 11.1449C10.9515 10.9007 11.0385 10.6969 11.2045 10.5333L12.8864 8.88888Z"
			fill="currentColor"
		/>
	</svg>
{/snippet}

{#snippet notificationsButton()}
	{#if app.user}
		<button
			class="notifications-btn link link-desktop"
			class:has-unseen={hasUnseenNotifications}
			onclick={toggleNotifications}
			aria-label="Notifications"
			bind:this={notificationsBtn}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 20" id="notifications">
				<path
					d="M8.93816 0.5C7.08165 0.5 5.30117 1.2375 3.98842 2.55025C2.67566 3.86301 1.93816 5.64348 1.93816 7.5V11.028C1.93831 11.1831 1.90236 11.3362 1.83316 11.475L0.116163 14.908C0.0322892 15.0757 -0.00731514 15.2621 0.00111129 15.4494C0.00953771 15.6368 0.0657151 15.8188 0.164308 15.9783C0.262901 16.1379 0.400635 16.2695 0.56443 16.3608C0.728224 16.4521 0.912641 16.5 1.10016 16.5H16.7762C16.9637 16.5 17.1481 16.4521 17.3119 16.3608C17.4757 16.2695 17.6134 16.1379 17.712 15.9783C17.8106 15.8188 17.8668 15.6368 17.8752 15.4494C17.8836 15.2621 17.844 15.0757 17.7602 14.908L16.0442 11.475C15.9746 11.3362 15.9383 11.1832 15.9382 11.028V7.5C15.9382 5.64348 15.2007 3.86301 13.8879 2.55025C12.5752 1.2375 10.7947 0.5 8.93816 0.5ZM8.93816 19.5C8.31751 19.5003 7.71204 19.3081 7.20518 18.9499C6.69833 18.5917 6.31505 18.0852 6.10816 17.5H11.7682C11.5613 18.0852 11.178 18.5917 10.6711 18.9499C10.1643 19.3081 9.55882 19.5003 8.93816 19.5Z"
					fill="currentColor"
				/>
			</svg>
			{#if hasUnseenNotifications}
				<div class="notifications-count"></div>
			{/if}
		</button>
	{/if}
{/snippet}

{#snippet accountButton()}
	{#if app.user}
		<button class="account-btn link link-desktop" onclick={toggleAccountMenu} aria-label="Account" bind:this={accountBtn}>
			{@render accountIcon()}
		</button>
	{/if}
{/snippet}

<style>
	nav {
		display: flex;
		align-items: center;
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
		height: 76px;

		& .container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1em;
		}

		& .left {
			display: flex;
			align-items: center;
			gap: 24px;
		}

		@media (max-width: 425px) {
			height: 70px;
		}
	}

	.links {
		display: flex;
		align-items: center;
		gap: 24px;

		@media (max-width: 850px) {
			gap: 16px;
		}
	}

	.link {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;
		position: relative;
		gap: 6px;
		transition: color 0.15s ease-in-out;
		color: var(--grey-400);
		padding: 2px;

		&:hover {
			color: var(--grey-100);
		}

		& svg:not(.hamburger-svg) {
			height: 16px;
			width: auto;

			&#notifications {
				height: 20px;
			}

			&#account-desktop {
				height: 22px;
			}

			@media (max-width: 850px) {
				&#notifications {
					height: 18px;
				}
			}
		}

		@media (max-width: 850px) {
			&.link-desktop svg:not(.hamburger-svg) {
				height: 14px;

				&#account-desktop {
					height: 20px;
				}
			}
		}
	}

	.navbar-hamburger {
		position: relative;
		background: none;
		border: none;
		width: 1.875rem;
		height: 1.875rem;
		z-index: 4;

		& .hamburger-svg {
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			transition: transform 400ms;
			-moz-user-select: none;
			-webkit-user-select: none;
			-ms-user-select: none;
			user-select: none;
			position: relative;
			bottom: 8px;
			right: 8px;

			&.active {
				transform: rotate(45deg);
			}

			& .line {
				fill: none;
				transition:
					stroke-dasharray 400ms,
					stroke-dashoffset 400ms;
				stroke: var(--grey-100);
				stroke-width: 5.5;
				stroke-linecap: round;
			}

			& .top {
				stroke-dasharray: 40 121;
			}

			& .bottom {
				stroke-dasharray: 40 121;
			}

			&.active .top {
				stroke-dashoffset: -68px;
			}

			&.active .bottom {
				stroke-dashoffset: -68px;
			}
		}
	}

	.sidebar-overlay {
		position: fixed;
		transition: opacity 0.3s ease-in-out;
		pointer-events: none;
		backdrop-filter: blur(10px);
		background: hsla(0, 0%, 0%, 0.9);
		width: 100%;
		height: 100dvh;
		opacity: 0;
		z-index: 1;
		top: 0;
		left: 0;

		&.active {
			pointer-events: all;
			opacity: 1;
		}
	}

	.sidebar {
		--side-padding: 24px;

		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		transition: transform 0.3s ease-in-out;
		position: fixed;
		background: var(--grey-700);
		right: 0;
		top: 0;
		height: 100dvh;
		width: 275px;
		transform: translateX(275px);
		padding: 68px 0 var(--side-padding) 0;
		z-index: 2;

		&.active {
			transform: translateX(0);
		}

		& > * {
			width: 100%;
		}

		& .sidebar-section h3 {
			padding: 12px var(--side-padding);
			background-color: var(--grey-800);
			font-weight: 500;
		}

		& .sidebar-links {
			text-align: right;
			padding: 6px 0;

			.link {
				padding: 10px var(--side-padding);
				width: 100%;
			}
		}

		& .sidebar-buttons {
			padding: 0 var(--side-padding);

			&:not(:first-child) {
				margin-top: 16px;
			}
		}
	}

	.notifications-btn,
	.account-btn {
		position: relative;
	}

	.notifications-btn {
		display: block;

		& .notifications-count {
			display: none;
			position: absolute;
			background-color: var(--primary-600);
			border: 2px solid var(--grey-700);
			border-radius: 50%;
			padding: 2px;
			height: 12px;
			width: 12px;
			right: -3px;
			top: -3px;
		}

		&.has-unseen {
			color: var(--grey-100);

			& .notifications-count {
				display: block;
			}
		}
	}

	.desktop {
		display: inherit;

		@media (max-width: 700px) {
			display: none;
		}
	}
	.mobile {
		display: none;

		@media (max-width: 700px) {
			display: inherit;
		}
	}
</style>
