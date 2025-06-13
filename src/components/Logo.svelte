<script lang="ts">
	import { version } from '$app/environment';

	type Props = {
		/**
		 * Show version badge.
		 * Clicking on it goes to the changelog page
		 * @default false
		 */
		showVersion?: boolean;
	};
	const { showVersion = false }: Props = $props();
</script>

<div class="logo-container">
	<a class="logo" href="/">
		<img src="/ui/swords.webp" alt="Clash of clans overlapping swords" />
		Clash <span>Armies</span>
	</a>
	{#if showVersion}
		<a href="/changelog" class="version"><span>v</span>{version}</a>
	{/if}
</div>

<style>
	.logo-container {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}

	.version {
		display: block;
		outline: none;
		background: none;
		white-space: nowrap;
		border: 1px dashed var(--primary-400);
		color: var(--primary-400);
		padding: 4px 7px;
		border-radius: 50px;
		font-weight: 700;
		transition: all 0.15s;
	}
	.version span {
		display: inline-block;
	}
	.version,
	.version span {
		font-size: 10px;
		line-height: 10px;
	}
	.version:hover,
	.version:focus-visible {
		background-color: var(--primary-400);
		color: var(--grey-100);
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

	@media (max-width: 425px) {
		.logo img {
			max-height: 26px;
		}

		.logo,
		.logo span {
			font-size: 18px;
		}

		.version {
			padding: 2.5px 5px;
		}

		.version,
		.version span {
			font-size: 9px;
			line-height: 9px;
		}
	}

	@media (max-width: 375px) {
		.version {
			display: none;
		}
	}
</style>
