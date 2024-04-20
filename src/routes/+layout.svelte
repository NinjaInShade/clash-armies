<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { onMount, setContext, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { createAppState } from '~/lib/state.svelte';
	import TownHall from '~/components/TownHall.svelte';
	import TownHallSelector from '~/components/TownHallSelector.svelte';
	import Button from '~/components/Button.svelte';

	type Props = {
		data: LayoutData;
		children: Snippet;
	};
	let { data, children } = $props<Props>();

	/**
	 * Due to first render being SSR, any state that will be overridden by localStorage onMount
	 * should start as null and consumers should show loading animations until the values are set.
	 */
	const appState = createAppState({
		// frequently used data (cache)
		troops: data.troops,
		sieges: data.sieges,
		spells: data.spells,
		townHalls: data.townHalls,
		// user state
		townHall: null,
		barrack: null,
		darkBarrack: null,
		laboratory: null,
		spellFactory: null,
		darkSpellFactory: null,
		workshop: null,
		// general app state
		modals: []
	});
	setContext('app', appState);

	onMount(async () => {
		// Use local storage is present & valid, otherwise default to max TH
		const savedTownHall = +(localStorage.getItem('townHall') ?? '??');
		appState.townHall = !Number.isNaN(savedTownHall) ? savedTownHall : data.townHalls.length;
	});

	function openTownHallSelector() {
		if (appState.townHall === null) {
			return;
		}
		appState.openModal(TownHallSelector, { appState });
	}
</script>

<nav>
	<div class="container">
		<a class="logo" href="/">
			<img src="/clash/ui/swords.png" alt="Clash of clans overlapping swords" />
			Clash <span>Armies</span>
		</a>
		<ul class="links">
			<li>
				<a class="body" href="/armies">Find</a>
			</li>
			<li>
				<a class="body" href="/create">Create</a>
			</li>
			<li>
				<a class="body" href="/account">Account</a>
			</li>
			<li class="control">
				<Button>Log in</Button>
			</li>
			<li class="control">
				<TownHall level={appState.townHall} onclick={openTownHallSelector} --width="80px" />
			</li>
		</ul>
	</div>
</nav>

{@render children()}

{#if appState.modals.length}
	<div transition:fade={{ duration: 150, easing: sineInOut }}>
		<button class="modal-backdrop" on:click={appState.modals.pop} />
		{#each appState.modals as modal}
			<svelte:component this={modal.component} {...modal.props} />
		{/each}
	</div>
{/if}

<style>
	nav {
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
	}

	nav .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo,
	.logo span {
		color: var(--grey-100);
		font-family: 'Clash', sans-serif;
		font-weight: 700;
		font-size: 20px;
	}

	.logo span {
		color: var(--primary-400);
	}

	.logo img {
		/** Optical alignment */
		position: relative;
		bottom: 1.5px;
		/* Rest */
		margin-right: 0.25em;
		max-height: 32px;
		height: 100%;
		width: auto;
	}

	.links {
		display: flex;
		align-items: center;
	}

	.links li:not(:last-child) {
		margin-right: 24px;
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

	.modal-backdrop {
		background-color: hsla(0, 0%, 0%, 0.7);
		backdrop-filter: blur(10px);
		position: absolute;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
