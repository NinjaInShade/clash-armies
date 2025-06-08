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

		&.primary {
			background-color: #806039;
			color: #f3e7d8;

			&:hover:not(:disabled) {
				background-color: hsl(33, 38%, 32%);
			}

			&.ghost {
				background: none;
				border: 1px dashed #cb995b;
				color: #cb995b;

				&:hover:not(:disabled) {
					background-color: hsl(33, 38%, 32%);
				}
			}
		}

		&.primary-dark {
			background-color: hsl(33, 15%, 26%);
			color: #e0a153;

			&:hover:not(:disabled) {
				background-color: hsl(33, 15%, 22%);
			}
		}

		&.success {
			background-color: #424c38;
			color: #53e059;

			&:hover:not(:disabled) {
				background-color: #384130;
			}

			&:focus-visible {
				outline: #53e059 dotted 2px;
			}

			&.ghost {
				background: none;
				border: 1px dashed #759257;
				color: #759257;

				&:hover:not(:disabled) {
					background-color: #20211e;
				}
			}
		}

		&.danger {
			background-color: #4c3838;
			color: #e05353;

			&:hover:not(:disabled) {
				background-color: #413030;
			}

			&:focus-visible {
				outline: #e05353 dotted 2px;
			}
		}

		&.grey {
			background-color: var(--grey-700);
			color: var(--grey-400);

			&:hover:not(:disabled) {
				background-color: var(--grey-600);
			}
		}
	}

	@media (max-width: 850px) {
		.action-btn {
			padding: 8px;
		}
	}
</style>
