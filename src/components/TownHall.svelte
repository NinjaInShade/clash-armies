<script lang="ts">
	type Props = {
		/** Town hall level */
		level: number;
		/** The click handler that is fired upon click of the town hall */
		onclick: (level: number) => void;
		/** Styling theme @default 'bordered' */
		theme?: 'regular' | 'bordered';
	};
	let { level, onclick, theme = 'regular', ...rest }: Props = $props();

	function handleSelect() {
		if (level === null) {
			throw new Error('Expected town hall to be set');
		}
		onclick(level);
	}
</script>

<button class="town-hall {theme}" onclick={handleSelect} title="Town hall {level}" {...rest}>
	<img src="/town-halls/{level}_small.webp" alt="Town hall {level}" />
	<p class="body">{level}</p>
</button>

<style>
	.town-hall {
		transition: background-color 0.15s ease-in-out;
		border-radius: 6px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--width, auto);
		padding: 4px 8px;
		gap: 4px;
	}
	.town-hall.regular {
		background: var(--grey-600);
		border: 1.5px solid var(--grey-600);
	}
	.town-hall.bordered {
		background: var(--grey-700);
		border: 1px solid var(--grey-500);
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

	@media (max-width: 850px) {
		.town-hall {
			height: 38px;
		}
	}
</style>
