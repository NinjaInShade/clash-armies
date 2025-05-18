<script lang="ts">
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import { type Snippet, tick } from 'svelte';

	type Props = {
		children: Snippet;
		/** Sets the theme of the button @default primary */
		theme?: 'primary' | 'danger';
		asLink?: boolean;
		onClick?: (ev: MouseEvent | KeyboardEvent) => Promise<void> | void;
	} & (HTMLButtonAttributes | HTMLAnchorAttributes);

	let { children, theme, asLink, onClick, ...rest }: Props = $props();

	let running = $state<boolean>(false);

	async function _onClick(ev: MouseEvent | KeyboardEvent) {
		if (!onClick || running) {
			return;
		}
		running = true;
		await onClick(ev);
		running = false;
	}
</script>

{#if asLink}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<a class="btn {theme}" onclick={onClick} {...rest}>
		<span>
			{@render children()}
		</span>
	</a>
{:else}
	<button class="btn {theme}" type="button" class:visually-disabled={running} onclick={_onClick} {...rest}>
		<span>
			{@render children()}
		</span>
		{#if running}
			<div class="spinner-container">
				<span class="spinner"></span>
			</div>
		{/if}
	</button>
{/if}

<style>
	.btn :global(svg path) {
		transition: 0.15s ease-in-out;
	}

	.btn {
		transition: 0.15s ease-in-out;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: 10px 18px;
		background-color: var(--primary-500);
		border-radius: 8px;
		gap: 10px;

		&:not(:disabled):not(.visually-disabled) {
			cursor: pointer;
		}
	}

	.btn,
	.btn span {
		text-shadow: var(--txt-shadow);
		-webkit-text-stroke: var(--txt-stroke);
		font-family: 'Clash', sans-serif;
		font-weight: 700;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		position: relative;
	}

	.btn-sm {
		padding: 7.5px 16px;
		gap: 6px;
	}

	.btn-sm,
	.btn-sm span {
		font-size: var(--fs-sm);
		line-height: var(--fs-sm-lh);
	}

	.btn::before {
		transition: 0.15s ease-in-out;
		background-color: var(--primary-400);
		border-radius: 8px 8px 4px 4px;
		width: calc(100% - 8px);
		height: calc(50% - 4px);
		position: absolute;
		content: '';
		left: 4px;
		top: 4px;
	}

	.btn:hover:not(:disabled):not(.visually-disabled),
	.btn:focus-visible {
		background-color: var(--primary-600);
	}

	.btn:hover:not(:disabled):not(.visually-disabled)::before {
		background-color: var(--primary-500);
	}

	.btn:focus-visible {
		outline: var(--grey-100) dotted 2px;
	}

	.btn.danger {
		background-color: hsl(0, 45%, 38%);
	}
	.btn.danger::before {
		background-color: hsl(0, 45%, 45%);
	}
	.btn.danger:hover:not(:disabled):not(.visually-disabled)::before {
		background-color: hsl(0, 45%, 40%);
	}
	.btn.danger:hover:not(:disabled):not(.visually-disabled),
	.btn.danger:focus-visible {
		background-color: hsl(0, 45%, 33%);
	}

	.spinner-container {
		position: absolute;
		transform: translate(-50%, -50%);
		left: 50%;
		top: 50%;
	}
	.spinner {
		width: 12px;
		height: 12px;
		border: 5px solid #fff;
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
