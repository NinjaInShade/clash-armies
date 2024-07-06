<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '~/lib/shared/types';
	import C from '~/components';

	const app = getContext<AppState>('app');

	let sidebarOpen = $state<boolean>(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		document.body.classList.toggle('sidebar-active');
	}
</script>

<nav>
	<div class="container">
		<div class="left">
			<C.Logo />
			<ul class="links">
				<li>
					<a class="body" href="/armies">Armies</a>
				</li>
				{#if app.user}
					<li>
						<a class="body" href="/create">Create</a>
					</li>
				{/if}
			</ul>
		</div>
		<ul class="links">
			{#if app.user && app.user.hasRoles('admin')}
				<li>
					<a class="body" href="/admin">Admin</a>
				</li>
			{/if}
			{#if app.user}
				<li>
					<a class="body" href="/users/{app.user.username}">Account</a>
				</li>
			{/if}
			<li class="control">
				{#if app.user}
					<C.Button asLink href="/logout">Log out</C.Button>
				{:else}
					<C.Button asLink href="/login">Log in</C.Button>
				{/if}
			</li>
		</ul>
		<div class="mobile-nav">
			<button class="navbar-hamburger" type="button" aria-label="Sidebar toggle" onclick={toggleSidebar}>
				<svg class="ham hamRotate ham4" class:active={sidebarOpen} viewBox="0 0 100 100" width="45">
					<path class="line top" d="m 70,33 h -40 c 0,0 -8.5,-0.149796 -8.5,8.5 0,8.649796 8.5,8.5 8.5,8.5 h 20 v -20" />
					<path class="line middle" d="m 70,50 h -40" />
					<path class="line bottom" d="m 30,67 h 40 c 0,0 8.5,0.149796 8.5,-8.5 0,-8.649796 -8.5,-8.5 -8.5,-8.5 h -20 v 20" />
				</svg>
			</button>
		</div>
	</div>
</nav>

<nav class="sidebar" class:sidebar-active={sidebarOpen}>
	<div>
		<ul class="sidebar-links">
			<li class="sidebar-link">
				<a href="/" onclick={toggleSidebar}>Home</a>
			</li>
			<li class="sidebar-link">
				<a href="/armies" onclick={toggleSidebar}>Armies</a>
			</li>
			{#if app.user}
				<li class="sidebar-link">
					<a href="/create" onclick={toggleSidebar}>Create</a>
				</li>
			{/if}
			{#if app.user && app.user.hasRoles('admin')}
				<li class="sidebar-link">
					<a href="/admin" onclick={toggleSidebar}>Admin</a>
				</li>
			{/if}
			{#if app.user}
				<li class="sidebar-link">
					<a href="/users/{app.user.username}" onclick={toggleSidebar}>Account</a>
				</li>
			{/if}
		</ul>
		<ul class="sidebar-links">
			<li class="sidebar-link">
				{#if app.user}
					<C.Button asLink href="/logout" style="width: 100%;" onclick={toggleSidebar}>Log out</C.Button>
				{:else}
					<C.Button asLink href="/login" style="width: 100%;" onclick={toggleSidebar}>Log in</C.Button>
				{/if}
			</li>
		</ul>
	</div>
</nav>
<button class="sidebar-overlay" class:sidebar-overlay-active={sidebarOpen} onclick={toggleSidebar}></button>

<style>
	nav {
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
	}

	nav .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}

	nav .left {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.links {
		display: flex;
		align-items: center;
	}

	.links li:not(:last-child) {
		margin-right: 16px;
	}

	.links li.control:not(:last-child) {
		margin-right: 8px;
	}

	.links li a {
		transition: color 0.15s ease-in-out;
		color: var(--grey-400);
	}

	.links li a:hover {
		color: var(--grey-300);
	}

	/* Hamburger */
	.mobile-nav {
		display: none;
	}

	.navbar-hamburger {
		position: relative;
		background: none;
		outline: none;
		border: none;
		width: 1.875rem;
		height: 1.875rem;
		z-index: 4;
	}

	.ham {
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
	}

	.hamRotate.active {
		transform: rotate(45deg);
	}

	.line {
		fill: none;
		transition:
			stroke-dasharray 400ms,
			stroke-dashoffset 400ms;
		stroke: var(--grey-100);
		stroke-width: 5.5;
		stroke-linecap: round;
	}

	.ham4 .top {
		stroke-dasharray: 40 121;
	}

	.ham4 .bottom {
		stroke-dasharray: 40 121;
	}

	.ham4.active .top {
		stroke-dashoffset: -68px;
	}

	.ham4.active .bottom {
		stroke-dashoffset: -68px;
	}

	:global(body.sidebar-active) {
		position: fixed;
		height: 100vh;
	}

	/* Sidebar */

	.sidebar-overlay {
		position: fixed;
		transition: opacity 0.3s ease-in-out;
		pointer-events: none;
		backdrop-filter: blur(10px);
		background: hsla(0, 0%, 0%, 0.9);
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: 1;
		top: 0;
		left: 0;
	}

	.sidebar {
		display: flex;
		transition: transform 0.3s ease-in-out;
		position: fixed;
		background: var(--grey-700);
		right: 0;
		top: 0;
		height: 100%;
		width: 275px;
		transform: translateX(275px);
		padding: 0 48px;
		z-index: 2;
	}

	.sidebar-active {
		transform: translateX(0);
	}

	.sidebar-overlay-active {
		pointer-events: all;
		opacity: 1;
	}

	.sidebar > div {
		display: none;
		padding: 65px 0 32px 0;
	}

	.sidebar-links {
		text-align: right;
	}

	.sidebar-link {
		display: flex;
		justify-content: flex-end;
	}

	.sidebar-link:not(:last-child) {
		padding-bottom: 16px;
	}

	.sidebar-link a {
		position: relative;
		transition: opacity 0.2s ease-in-out;
		color: var(--grey-100);
		opacity: 0.5;
	}

	.sidebar-link a:hover {
		opacity: 1;
	}

	@media (max-width: 815px) {
		.links {
			display: none;
		}
		.mobile-nav {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.sidebar-active > div {
			display: flex;
			flex-flow: column nowrap;
			justify-content: space-between;
			flex: 1 0 0px;
		}
	}

	@media (max-width: 425px) {
		nav {
			padding: 20px var(--side-padding);
		}

		.ham {
			width: 40px;
		}

		.navbar-hamburger {
			width: 1.45rem;
			height: 1.45rem;
		}

		.sidebar {
			padding: 0 40px;
		}
	}
</style>
