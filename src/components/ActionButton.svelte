<script lang="ts">
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		/** Sets the theme of the button @default primary */
		theme?: 'primary' | 'primary-dark' | 'success' | 'danger' | 'grey';
		/** Whether to style as a ghost button (no background and a border) */
		ghost?: boolean;
		asLink?: boolean;
		class?: string;
	} & (HTMLButtonAttributes | HTMLAnchorAttributes);

	let { children, theme = 'primary', ghost, asLink, class: _class, ...rest }: Props = $props();
</script>

{#if asLink}
	<a class="action-btn {theme} {_class ? _class : ''} {theme === 'grey' ? 'focus-grey' : ''}" class:ghost type="button" {...rest}>
		{@render children()}
	</a>
{:else}
	<button class="action-btn {theme} {_class ? _class : ''} {theme === 'grey' ? 'focus-grey' : ''}" class:ghost type="button" {...rest}>
		{@render children()}
	</button>
{/if}

<style>
	.action-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 14px;
		line-height: 14px;
		font-weight: 500;
		padding: 6px 8px;
		border-radius: 4px;
		transition: background 0.15 ease-in-out;
		white-space: nowrap;
	}

	/* Regular */
	.action-btn.primary {
		background-color: #806039;
		color: #f3e7d8;
	}
	.action-btn.primary :global(svg path) {
		fill: #f3e7d8;
	}
	.action-btn.primary:hover:not(:disabled) {
		background-color: hsl(33, 38%, 32%);
	}
	.action-btn.primary-dark {
		background-color: hsl(33, 15%, 26%);
		color: #e0a153;
	}
	.action-btn.primary-dark :global(svg path) {
		fill: #e0a153;
	}
	.action-btn.primary-dark:hover:not(:disabled) {
		background-color: hsl(33, 15%, 22%);
	}
	.action-btn.success {
		background-color: #424c38;
		color: #53e059;
	}
	.action-btn.success:focus {
		outline: #53e059 dotted 2px;
	}
	.action-btn.success :global(svg path) {
		fill: #53e059;
	}
	.action-btn.success:hover:not(:disabled) {
		background-color: #384130;
	}
	.action-btn.danger {
		background-color: #4c3838;
		color: #e05353;
	}
	.action-btn.danger:focus {
		outline: #e05353 dotted 2px;
	}
	.action-btn.danger :global(svg path) {
		fill: #e05353;
	}
	.action-btn.danger:hover:not(:disabled) {
		background-color: #413030;
	}

	.action-btn.grey {
		background-color: var(--grey-850);
		color: var(--grey-400);
	}
	.action-btn.grey :global(svg path) {
		fill: var(--grey-400);
	}
	.action-btn.grey:hover:not(:disabled) {
		background-color: var(--grey-600);
	}

	/* Ghost */
	.action-btn.primary.ghost {
		background: none;
		border: 1px dashed #cb995b;
		color: #cb995b;
	}
	.action-btn.primary.ghost :global(svg path) {
		fill: #cb995b;
	}
	.action-btn.primary.ghost:hover:not(:disabled) {
		background-color: #463c2e;
	}
	.action-btn.success.ghost {
		background: none;
		border: 1px dashed #759257;
		color: #759257;
	}
	.action-btn.success.ghost :global(svg path) {
		fill: #759257;
	}
	.action-btn.success.ghost:hover:not(:disabled) {
		background-color: #20211e;
	}

	@media (max-width: 850px) {
		.action-btn {
			padding: 8px;
		}
	}
</style>
