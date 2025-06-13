<script lang="ts">
	import type { AppState } from '$types';
	import { getContext } from 'svelte';
	import Menu from '../Menu.svelte';

	type Props = {
		value: number | undefined;
		onChange: (value: number | undefined) => void;
	};
	const { value, onChange }: Props = $props();
	const app = getContext<AppState>('app');

	let menuRef = $state<HTMLButtonElement>();
	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function onClick(level: number) {
		onChange(value === level ? undefined : level);
		menuOpen = false;
	}
</script>

<button
	class="utility-btn regular th-btn"
	style="--bg-clr: var(--grey-850); --bg-clr-hover: var(--grey-900); --gap: 4px; --fs: 15px; --fs-weight: 500;"
	class:active={value !== undefined}
	type="button"
	bind:this={menuRef}
	onclick={toggleMenu}
>
	{#if value === undefined}
		<img src="/clash/town-halls/17_small.webp" alt="Town hall 17" />
		TH
	{:else}
		<img src="/clash/town-halls/{value}_small.webp" alt="Town hall {value}" />
		TH{value}
	{/if}
</button>

<Menu bind:open={menuOpen} elRef={menuRef}>
	<div class="ca-menu th-menu">
		<ul class="ca-menu-list">
			{#each [...app.townHalls].reverse() as th}
				{@const isSelected = value === th.level}
				<li>
					<button
						type="button"
						class="town-hall {isSelected ? 'disabled' : ''} focus-grey"
						onclick={() => onClick(th.level)}
						title={isSelected ? `Town hall ${th.level} is already selected` : `Town hall ${th.level}`}
					>
						<div class="flex">
							<img src="/clash/town-halls/{th.level}_small.webp" alt="Town hall {th.level}" />
							<p class="body">{th.level}</p>
						</div>
						{#if value === th.level}
							<svg viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3.00044 3.99976L0.999912 2.00024L0 3L3.00044 6L8 1.00047L7.0008 0L3.00044 3.99976Z" fill="var(--grey-100)" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</Menu>

<style>
	.th-btn {
		text-transform: none;
		color: var(--grey-400);
		height: var(--controls-height);

		& img {
			max-height: 22px;
			width: auto;
		}

		&:not(.active) img {
			filter: grayscale();
		}

		&.active {
			color: hsl(33, 52%, 58%);
		}
	}

	.th-menu {
		overflow-y: auto;
		max-height: 250px;
		min-width: 125px;

		& .town-hall {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;

			& .flex {
				height: 22px;
				display: flex;
				gap: 4px;
			}

			& .body {
				font-family: 'Clash', sans-serif;
				color: var(--grey-100);
				min-width: 2ch;
			}

			& img {
				max-height: 100%;
				width: auto;
			}
		}

		& ul {
			padding: 0;
		}

		& li {
			padding: 3px 0;

			&:hover {
				background-color: var(--grey-800);
			}

			&:not(last-child) {
				border-bottom: 1px solid var(--grey-600);
			}

			& svg {
				height: 12px;
				width: auto;
			}
		}
	}
</style>
