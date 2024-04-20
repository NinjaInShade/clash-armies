<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { onMount, setContext } from 'svelte';
	import { createAppState } from '~/lib/state.svelte';

	/**
	 * Due to first render being SSR, any state that will be overridden by localStorage onMount
	 * should start as null and consumers should show loading animations until the values are set.
	 */
	const appState = createAppState({
		townHall: null
	});
	setContext('townHall', appState);

	onMount(() => {
		// TODO: validate town hall level from localStorage and don't hardcode default
		const savedTownHall = +(localStorage.getItem('townHall') ?? '??');
		appState.townHall = !Number.isNaN(savedTownHall) ? savedTownHall : 16;
	});
</script>

<nav>
	<div class="container">
		<a href="/">Clash <span>Armies</span></a>
		<ul class="links">
			<li>
				<a class="body" href="/armies">Find</a>
			</li>
			<li>
				<a class="body" href="/create-army">Create</a>
			</li>
			<li>
				<a class="body" href="/account">Account</a>
			</li>
			<li>
				<button class="btn">Log in</button>
			</li>
		</ul>
	</div>
</nav>

<slot />

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

	nav ul {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	nav .container > a,
	nav .container > a span {
		color: var(--grey-100);
		font-family: 'Clash', sans-serif;
		font-weight: 700;
		font-size: 20px;
	}

	nav .container > a span {
		color: var(--primary-300);
	}

	nav li a {
		transition: color 0.15s ease-in-out;
		color: var(--grey-400);
	}

	nav li a:hover {
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
