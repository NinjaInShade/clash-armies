<script lang="ts">
	import type { AppState } from '~/lib/shared/types';

	type Props = {
		/** Town hall level */
		level: AppState['townHall'];
		/** The click handler that is fired upon click of the town hall */
		onclick: (level: number) => void;
	};
	let { level, onclick, ...rest } = $props<Props>();

	function handleSelect() {
		if (level === null) {
			throw new Error('Expected town hall to be set');
		}
		onclick(level);
	}
</script>

{#if level === null}
	<div class="loading" />
{:else}
	<button class="town-hall" onclick={handleSelect} title="Town hall {level}" {...rest}>
		<img src="/clash/buildings/town-hall-{level}.png" alt="Town hall {level}" />
		<p class="body">{level}</p>
	</button>
{/if}

<style>
	.loading,
	.town-hall {
		transition: background-color 0.15s ease-in-out;
		border: 1.5px solid var(--grey-600);
		border-radius: 8px;
		height: 44px;
	}

	.loading {
		width: 80px;
		animation: shimmer 1.5s linear infinite;
		background: linear-gradient(to right, transparent 0%, var(--grey-800-shimmer) 25%, transparent 50%), var(--grey-600);
		background-size: 200% 100%;
	}

	.town-hall {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--grey-600);
		width: var(--width, auto);
		padding: 4px 8px;
		gap: 4px;
	}

	.town-hall:hover:not(:disabled) {
		background: none;
	}

	.town-hall .body {
		font-family: 'Clash', sans-serif;
		font-weight: 500;
		color: var(--grey-100);
	}

	.town-hall img {
		max-height: 100%;
		width: auto;
	}

	@keyframes shimmer {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}
</style>
